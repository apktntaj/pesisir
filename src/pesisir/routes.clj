(ns pesisir.routes
  "API route handlers"
  (:require [pesisir.db :as db]
            [pesisir.auth.service :as auth-service]
            [pesisir.auth.middleware :as auth-mw]
            [cheshire.core :as json]
            [taoensso.timbre :as log]))

;; ============================================================================
;; Utility Functions
;; ============================================================================

(defn json-response
  "Create a JSON response"
  [data & {:keys [status] :or {status 200}}]
  {:status status
   :headers {"Content-Type" "application/json"}
   :body (json/generate-string data)})

(defn get-client-ip
  "Extract client IP address from request"
  [request]
  (or (get-in request [:headers "x-forwarded-for"])
      (get-in request [:remote-addr])
      "unknown"))

(defn get-user-agent
  "Extract user agent from request"
  [request]
  (get-in request [:headers "user-agent"] "unknown"))

(defn extract-json-body
  "Parse request body as JSON"
  [request]
  (try
    (when-let [body (:body request)]
      (let [content (if (string? body) body (slurp body))]
        (json/parse-string content true)))
    (catch Exception e
      (log/error "Failed to parse JSON body" {:error (.getMessage e)})
      nil)))

;; ============================================================================
;; Health Check Route
;; ============================================================================

(defn health
  "GET /health - Health check endpoint"
  [_request]
  (let [db-health (db/health-check)
        status (if (= :healthy (:status db-health)) 200 503)
        response (assoc db-health :timestamp (str (:timestamp db-health)))]
    {:status status
     :body response}))

;; ============================================================================
;; Authentication Routes
;; ============================================================================

(defn register
  "POST /api/auth/register - Register new user"
  [request]
  (try
    (let [body (extract-json-body request)
          {:keys [email name password]} body]
      
      (if (and email name password)
        (let [result (auth-service/register-user email name password)]
          (if (:success result)
            (json-response
              {:success true
               :user (dissoc (:user result) :password_hash :verification_token)
               :token (:token result)
               :message (:message result)}
              :status 201)
            (json-response
              {:error (:error result)
               :errors (:errors result)}
              :status 400)))
        
        (json-response
          {:error "Missing required fields"
           :required-fields ["email" "name" "password"]}
          :status 400)))
    
    (catch Exception e
      (log/error "Registration handler error" {:error (.getMessage e)})
      (json-response
        {:error "Internal server error"}
        :status 500))))

(defn login
  "POST /api/auth/login - Login user"
  [request]
  (try
    (let [body (extract-json-body request)
          {:keys [email password]} body
          ip-address (get-client-ip request)
          user-agent (get-user-agent request)]
      
      (if (and email password)
        (let [result (auth-service/login-user email password ip-address user-agent)]
          (if (:success result)
            (json-response
              {:success true
               :user (dissoc (:user result) :password_hash :verification_token :reset_token)
               :token (:token result)
               :refresh-token (:refresh-token result)
               :expires-in-seconds (:expires-in-seconds result)}
              :status 200)
            (json-response
              {:error (:error result)}
              :status 401)))
        
        (json-response
          {:error "Missing required fields"
           :required-fields ["email" "password"]}
          :status 400)))
    
    (catch Exception e
      (log/error "Login handler error" {:error (.getMessage e)})
      (json-response
        {:error "Internal server error"}
        :status 500))))

(defn verify-email
  "POST /api/auth/verify-email - Verify user email"
  [request]
  (try
    (let [body (extract-json-body request)
          {:keys [token]} body]
      
      (if token
        (let [result (auth-service/verify-email token)]
          (if (:success result)
            (json-response
              {:message (:message result)}
              :status 200)
            (json-response
              {:error (:error result)}
              :status 400)))
        
        (json-response
          {:error "Missing required field: token"}
          :status 400)))
    
    (catch Exception e
      (log/error "Email verification handler error" {:error (.getMessage e)})
      (json-response
        {:error "Internal server error"}
        :status 500))))

(defn refresh-token
  "POST /api/auth/refresh - Refresh access token"
  [request]
  (try
    (let [body (extract-json-body request)
          {:keys [refresh-token]} body]
      
      (if refresh-token
        (let [result (auth-service/refresh-access-token refresh-token)]
          (if (:success result)
            (json-response
              {:token (:token result)
               :expires-in-seconds (:expires-in-seconds result)}
              :status 200)
            (json-response
              {:error (:error result)}
              :status 401)))
        
        (json-response
          {:error "Missing required field: refresh-token"}
          :status 400)))
    
    (catch Exception e
      (log/error "Token refresh handler error" {:error (.getMessage e)})
      (json-response
        {:error "Internal server error"}
        :status 500))))

(defn forgot-password
  "POST /api/auth/forgot-password - Request password reset"
  [request]
  (try
    (let [body (extract-json-body request)
          {:keys [email]} body]
      
      (if email
        (let [result (auth-service/request-password-reset email)]
          (json-response
            {:message (:message result)}
            :status 200))
        
        (json-response
          {:error "Missing required field: email"}
          :status 400)))
    
    (catch Exception e
      (log/error "Forgot password handler error" {:error (.getMessage e)})
      (json-response
        {:error "Internal server error"}
        :status 500))))

(defn reset-password
  "POST /api/auth/reset-password - Reset password with token"
  [request]
  (try
    (let [body (extract-json-body request)
          {:keys [token password]} body]
      
      (if (and token password)
        (let [result (auth-service/reset-password token password)]
          (if (:success result)
            (json-response
              {:message (:message result)}
              :status 200)
            (json-response
              {:error (:error result)
               :errors (:errors result)}
              :status 400)))
        
        (json-response
          {:error "Missing required fields"
           :required-fields ["token" "password"]}
          :status 400)))
    
    (catch Exception e
      (log/error "Reset password handler error" {:error (.getMessage e)})
      (json-response
        {:error "Internal server error"}
        :status 500))))

(defn logout
  "POST /api/auth/logout - Logout user"
  [request]
  (try
    (if-let [user-id (auth-mw/get-user-id request)]
      (let [_ (auth-service/logout-user user-id)]
        (json-response
          {:message "Logged out successfully"}
          :status 200))
      
      (json-response
        {:error "Authentication required"}
        :status 401))
    
    (catch Exception e
      (log/error "Logout handler error" {:error (.getMessage e)})
      (json-response
        {:error "Internal server error"}
        :status 500))))

;; ============================================================================
;; Route Definitions
;; ============================================================================

(def auth-routes
  "Authentication routes"
  ["/auth"
   ["/register" {:post register}]
   ["/login" {:post login}]
   ["/verify-email" {:post verify-email}]
   ["/refresh" {:post refresh-token}]
   ["/forgot-password" {:post forgot-password}]
   ["/reset-password" {:post reset-password}]
   ["/logout" {:post logout}]])

;; ============================================================================
;; User Profile Routes  
;; ============================================================================

(defn get-current-user
  "GET /api/me - Get current authenticated user"
  [request]
  (if-let [user (auth-mw/get-user request)]
    (json-response
      {:success true
       :user (dissoc user :password_hash :verification_token :reset_token)}
      :status 200)
    (json-response
      {:error "Authentication required"}
      :status 401)))

(def user-routes
  "User profile routes"
  [["/me" {:get get-current-user}]])
