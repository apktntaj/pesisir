(ns pesisir.user.db
  "User database operations"
  (:require [pesisir.db :as db]
            [clojure.string :as str]
            [clojure.data.json :as json]))

;; ============================================================================
;; Utilities
;; ============================================================================

(defn now-timestamp
  "Get current timestamp as java.sql.Timestamp for DB compatibility"
  []
  (java.sql.Timestamp. (System/currentTimeMillis)))

;; ============================================================================
;; User Queries
;; ============================================================================

(defn find-by-id
  "Find user by ID"
  [id]
  (first (db/query "SELECT * FROM users WHERE id = ?" [id])))

(defn find-by-email
  "Find user by email (case-insensitive)"
  [email]
  (first (db/query "SELECT * FROM users WHERE LOWER(email) = LOWER(?)" [email])))

(defn find-by-verification-token
  "Find user by verification token"
  [token]
  (first (db/query 
    "SELECT * FROM users WHERE verification_token = ? AND verification_token_expires_at > NOW()"
    [token])))

(defn find-by-reset-token
  "Find user by password reset token"
  [token]
  (first (db/query
    "SELECT * FROM users WHERE reset_token = ? AND reset_token_expires_at > NOW()"
    [token])))

(defn list-users
  "List all users with pagination"
  [limit offset]
  (db/query
   "SELECT id, email, full_name, email_verified, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?"
   [limit offset]))

;; ============================================================================
;; User Creation & Update
;; ============================================================================

(defn create-user!
  "Create a new user in database
   Returns map with user id or throws exception"
  [email full-name hashed-password]
  (let [now (java.sql.Timestamp. (System/currentTimeMillis))
        result (db/insert! :users
                           {:email (str/lower-case email)
                            :full_name full-name
                            :password_hash hashed-password
                            :email_verified false
                            :created_at now
                            :updated_at now})]
    (first result)))

(defn update-user!
  "Update user information"
  [user-id updates]
  (let [updates (assoc updates :updated_at (now-timestamp))]
    (db/update! :users
      updates
      ["id = ?" user-id])))

(defn instant->timestamp
  "Convert java.time.Instant to java.sql.Timestamp for DB compatibility"
  [instant]
  (if instant
    (java.sql.Timestamp/from instant)
    nil))

(defn set-verification-token!
  "Set verification token for user"
  [user-id token expires-at]
  (update-user! user-id
    {:verification_token token
     :verification_token_expires_at (instant->timestamp expires-at)}))

(defn clear-verification-token!
  "Clear verification token after email is verified"
  [user-id]
  (update-user! user-id
    {:verification_token nil
     :verification_token_expires_at nil
     :email_verified true}))

(defn set-reset-token!
  "Set password reset token for user"
  [user-id token expires-at]
  (update-user! user-id
    {:reset_token token
     :reset_token_expires_at (instant->timestamp expires-at)}))

(defn clear-reset-token!
  "Clear reset token after password is reset"
  [user-id]
  (update-user! user-id
    {:reset_token nil
     :reset_token_expires_at nil}))

(defn update-password!
  "Update user password and clear reset token"
  [user-id hashed-password]
  (update-user! user-id
    {:password_hash hashed-password
     :reset_token nil
     :reset_token_expires_at nil}))

(defn update-last-login!
  "Update last login timestamp"
  [user-id]
  (update-user! user-id
    {:last_login (now-timestamp)}))

(defn delete-user!
  "Soft delete user (set deleted_at)"
  [user-id]
  (update-user! user-id
    {:deleted_at (now-timestamp)}))

;; ============================================================================
;; User Existence Checks
;; ============================================================================

(defn email-exists?
  "Check if email is already registered"
  [email]
  (some? (find-by-email email)))

(defn user-exists?
  "Check if user ID exists"
  [user-id]
  (some? (find-by-id user-id)))

;; ============================================================================
;; Session Management
;; ============================================================================

(defn create-session!
  "Create a new user session"
  [user-id token token-type ip-address user-agent expires-at]
  (db/insert! :sessions
    {:user_id user-id
     :token token
     :token_type token-type
     :ip_address ip-address
     :user_agent user-agent
     :created_at (now-timestamp)
     :expires_at (if (instance? java.time.Instant expires-at) 
                   (instant->timestamp expires-at)
                   expires-at)}))

(defn find-session
  "Find active session by token"
  [token]
  (first (db/query
    "SELECT * FROM sessions WHERE token = ? AND expires_at > NOW() AND revoked_at IS NULL"
    [token])))

(defn revoke-session!
  "Revoke a session"
  [token reason]
  (db/update! :sessions
    {:revoked_at (now-timestamp)
     :revoked_reason reason}
    ["token = ?" token]))

(defn revoke-user-sessions!
  "Revoke all sessions for a user"
  [user-id reason]
  (db/execute!
    "UPDATE sessions SET revoked_at = ?, revoked_reason = ? WHERE user_id = ? AND revoked_at IS NULL"
    [(now-timestamp) reason user-id]))

;; ============================================================================
;; Audit Logging
;; ============================================================================

(defn create-audit-log!
  "Create an audit log entry"
  [user-id action resource-type resource-id old-values new-values ip-address user-agent status error-message]
  (db/insert! :audit_logs
    {:user_id user-id
     :action action
     :resource_type resource-type
     :resource_id resource-id
     :old_values (when old-values (json/write-str old-values))
     :new_values (when new-values (json/write-str new-values))
     :ip_address ip-address
     :user_agent user-agent
     :status status
     :error_message error-message
     :created_at (now-timestamp)}))

(defn get-user-audit-logs
  "Get audit logs for a specific user"
  [user-id limit offset]
  (db/query
    "SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
    [user-id limit offset]))
