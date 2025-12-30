(ns pesisir.auth.service
  "Authentication business logic"
  (:require [pesisir.auth.password :as pwd]
            [pesisir.auth.jwt :as jwt]
            [pesisir.user.db :as user-db]
            [pesisir.email.service :as email]
            [pesisir.user.domain :as user-domain]
            [clojure.string :as str]
            [taoensso.timbre :as log]))

;; ============================================================================
;; User Registration
;; ============================================================================

(defn register-user
  "Register a new user
   Returns: {:success true :user {...} :token ...} or {:success false :error ...}"
  [email name password]
  (try
    ;; Validate inputs
    (let [errors (user-domain/validate-user-create email name password)]
      (if (seq errors)
        {:success false :errors errors}
        ;; Check if email already exists
        (if (user-db/email-exists? email)
          {:success false :errors ["Email is already registered"]}
          ;; Create user
          (let [hashed-password (pwd/hash-password password)
                user (user-db/create-user! email name hashed-password)
                user-id (:id user)
                ;; Generate verification token
                verification-result (jwt/create-verification-token user-id email)
                verification-token (:token verification-result)
                ;; Set verification token in database
                _ (user-db/set-verification-token! user-id verification-token (:expires-at verification-result))
                ;; Send verification email
                email-sent (email/send-verification-email email name verification-token)
                ;; Generate JWT tokens for immediate use
                auth-result (jwt/create-token user-id email :user)
                access-token (:token auth-result)]
            
            (log/info "User registered" {:user-id user-id :email email})
            
            {:success true
             :user (dissoc user :password_hash)
             :token access-token
             :email-sent email-sent
             :message (if email-sent
                        "Registration successful. Check your email to verify your account."
                        "Registration successful. Please verify your email.")}))))
    
    (catch Exception e
      (log/error "Registration failed" {:error (.getMessage e)})
      {:success false :error "Registration failed. Please try again."})))

;; ============================================================================
;; Email Verification
;; ============================================================================

(defn verify-email
  "Verify user email with token
   Returns: {:success true} or {:success false :error ...}"
  [token]
  (try
    (if-let [claims (jwt/verify-verification-token token)]
      (let [user-id (:user-id claims)
            user (user-db/find-by-id user-id)]
        (if user
          (do
            ;; Clear verification token and mark email as verified
            (user-db/clear-verification-token! user-id)
            (log/info "Email verified" {:user-id user-id})
            
            ;; Send welcome email
            (email/send-welcome-email (:email user) (:full_name user))
            
            {:success true :message "Email verified successfully"})
          {:success false :error "User not found"}))
      {:success false :error "Invalid or expired verification token"})
    
    (catch Exception e
      (log/error "Email verification failed" {:error (.getMessage e)})
      {:success false :error "Email verification failed"})))

;; ============================================================================
;; User Login
;; ============================================================================

(defn login-user
  "Authenticate user with email and password
   Returns: {:success true :user {...} :token ...} or {:success false :error ...}"
  [email password ip-address user-agent]
  (try
    (if-let [user (user-db/find-by-email email)]
      (if (not (:email_verified user))
        {:success false :error "Please verify your email before logging in"}
        (if (pwd/verify-password password (:password_hash user))
          ;; Login successful
          (let [user-id (:id user)
                role (keyword (:role user))
                ;; Update last login
                _ (user-db/update-last-login! user-id)
                ;; Create JWT token
                {:keys [token expires-in-seconds]} (jwt/create-token user-id (:email user) role)
                ;; Create refresh token
                refresh-result (jwt/create-refresh-token user-id)
                ;; Create session record
                _ (user-db/create-session! user-id token "jwt" ip-address user-agent (java.sql.Timestamp. (System/currentTimeMillis)))]
            
            (log/info "User logged in" {:user-id user-id :email email})
            
            {:success true
             :user (dissoc user :password_hash :verification_token :reset_token)
             :token token
             :refresh-token (:token refresh-result)
             :expires-in-seconds expires-in-seconds})
          
          ;; Wrong password
          (do
            (log/warn "Login failed - invalid password" {:email email})
            {:success false :error "Invalid email or password"})))
      
      ;; User not found
      (do
        (log/warn "Login failed - user not found" {:email email})
        {:success false :error "Invalid email or password"}))
    
    (catch Exception e
      (log/error "Login failed" {:error (.getMessage e)})
      {:success false :error "Login failed. Please try again."})))

;; ============================================================================
;; Token Refresh
;; ============================================================================

(defn refresh-access-token
  "Refresh access token using refresh token
   Returns: {:success true :token ...} or {:success false :error ...}"
  [refresh-token]
  (try
    (if-let [claims (jwt/verify-refresh-token refresh-token)]
      (let [user-id (:user-id claims)
            user (user-db/find-by-id user-id)]
        (if user
          (let [role (keyword (:role user))
                {:keys [token expires-in-seconds]} (jwt/create-token user-id (:email user) role)]
            (log/info "Token refreshed" {:user-id user-id})
            {:success true
             :token token
             :expires-in-seconds expires-in-seconds})
          {:success false :error "User not found"}))
      {:success false :error "Invalid or expired refresh token"})
    
    (catch Exception e
      (log/error "Token refresh failed" {:error (.getMessage e)})
      {:success false :error "Token refresh failed"})))

;; ============================================================================
;; Password Reset
;; ============================================================================

(defn request-password-reset
  "Request password reset for user email
   Returns: {:success true :message ...} or {:success false :error ...}"
  [email]
  (try
    (if-let [user (user-db/find-by-email email)]
      (let [user-id (:id user)
            {:keys [token expires-at]} (jwt/create-reset-token user-id email)
            _ (user-db/set-reset-token! user-id token expires-at)]
        
        ;; Send reset email
        (email/send-password-reset-email email (:full_name user) token)
        
        (log/info "Password reset requested" {:user-id user-id :email email})
        
        {:success true
         :message "If this email exists, you will receive a password reset link"})
      
      ;; Always return success for security (don't reveal if email exists)
      (do
        (log/info "Password reset requested for non-existent email" {:email email})
        {:success true
         :message "If this email exists, you will receive a password reset link"}))
    
    (catch Exception e
      (log/error "Password reset request failed" {:error (.getMessage e)})
      {:success false :error "Request failed. Please try again."})))

(defn reset-password
  "Reset password with reset token
   Returns: {:success true} or {:success false :error ...}"
  [token new-password]
  (try
    ;; Validate new password
    (let [errors (user-domain/validate-user-create "test@test.com" "Test User" new-password)]
      (if (some #(str/includes? % "Password") errors)
        {:success false :errors errors}
        
        (if-let [claims (jwt/verify-reset-token token)]
          (let [user-id (:user-id claims)
                user (user-db/find-by-id user-id)]
            (if user
              (let [hashed-password (pwd/hash-password new-password)
                    _ (user-db/update-password! user-id hashed-password)]
                
                ;; Send password changed confirmation email
                (email/send-password-changed-email (:email user) (:full_name user))
                
                ;; Revoke all sessions for security
                (user-db/revoke-user-sessions! user-id "Password changed")
                
                (log/info "Password reset" {:user-id user-id})
                
                {:success true :message "Password has been reset successfully"})
              {:success false :error "User not found"}))
          {:success false :error "Invalid or expired reset link"})))
    
    (catch Exception e
      (log/error "Password reset failed" {:error (.getMessage e)})
      {:success false :error "Password reset failed"})))

;; ============================================================================
;; Change Password
;; ============================================================================

(defn change-password
  "Change password for authenticated user
   Returns: {:success true} or {:success false :error ...}"
  [user-id current-password new-password]
  (try
    (if-let [user (user-db/find-by-id user-id)]
      ;; Verify current password
      (if (pwd/verify-password current-password (:password_hash user))
        ;; Validate new password
        (let [errors (user-domain/validate-user-create "test@test.com" "Test User" new-password)]
          (if (some #(str/includes? % "Password") errors)
            {:success false :errors errors}
            
            (let [hashed-password (pwd/hash-password new-password)
                  _ (user-db/update-password! user-id hashed-password)]
              
              ;; Send password changed confirmation
              (email/send-password-changed-email (:email user) (:full_name user))
              
              ;; Revoke all sessions except current
              (user-db/revoke-user-sessions! user-id "Password changed")
              
              (log/info "Password changed" {:user-id user-id})
              
              {:success true :message "Password changed successfully"})))
        
        {:success false :error "Current password is incorrect"})
      
      {:success false :error "User not found"})
    
    (catch Exception e
      (log/error "Change password failed" {:error (.getMessage e)})
      {:success false :error "Password change failed"})))

;; ============================================================================
;; Session Management
;; ============================================================================

(defn revoke-token
  "Revoke a specific token/session"
  [token reason]
  (try
    (user-db/revoke-session! token reason)
    (log/info "Token revoked" {:reason reason})
    {:success true}
    (catch Exception e
      (log/error "Revoke token failed" {:error (.getMessage e)})
      {:success false :error "Failed to revoke token"})))

(defn logout-user
  "Logout user by revoking all sessions"
  [user-id]
  (try
    (user-db/revoke-user-sessions! user-id "User logout")
    (log/info "User logged out" {:user-id user-id})
    {:success true}
    (catch Exception e
      (log/error "Logout failed" {:error (.getMessage e)})
      {:success false :error "Logout failed"})))
