(ns pesisir.auth.middleware
  "Authentication and authorization middleware"
  (:require [pesisir.auth.jwt :as jwt]
            [ring.util.response :as response]
            [taoensso.timbre :as log]))

;; ============================================================================
;; Auth Middleware
;; ============================================================================

(defn wrap-auth
  "Middleware that extracts JWT token and user claims from request
   Attaches user info to request if token is valid
   Does NOT require token - attach it if present"
  [handler]
  (fn [request]
    (if-let [token (jwt/extract-token request)]
      (if-let [claims (jwt/verify-access-token token)]
        (let [request-with-user (assoc request :user claims)]
          (log/debug "User authenticated" {:user-id (:user-id claims)})
          (handler request-with-user))
        (do
          (log/warn "Invalid token provided")
          (handler request)))
      (handler request))))

(defn wrap-require-auth
  "Middleware that requires valid JWT token
   Returns 401 if token is missing or invalid"
  [handler]
  (fn [request]
    (if-let [token (jwt/extract-token request)]
      (if-let [claims (jwt/verify-access-token token)]
        (let [request-with-user (assoc request :user claims)]
          (log/debug "User authenticated" {:user-id (:user-id claims)})
          (handler request-with-user))
        (do
          (log/warn "Invalid or expired token")
          (response/status (response/response {:error "Invalid or expired token"}) 401)))
      (do
        (log/warn "Missing authentication token")
        (response/status (response/response {:error "Authentication required"}) 401)))))

;; ============================================================================
;; Role-Based Access Control (RBAC)
;; ============================================================================

(defn wrap-require-role
  "Middleware that requires user to have specific role(s)
   Args:
     - handler: The request handler
     - required-roles: Keyword or collection of keywords (e.g., :admin or [:admin :user])"
  [handler required-roles]
  (fn [request]
    (let [user (:user request)
          required-set (if (coll? required-roles) (set required-roles) #{required-roles})
          user-role (when user (keyword (:role user)))]
      (if user
        (if (contains? required-set user-role)
          (handler request)
          (do
            (log/warn "Unauthorized access attempt" {:user-id (:user-id user) :required-roles required-roles :user-role user-role})
            (response/status (response/response {:error "Insufficient permissions"}) 403)))
        (do
          (log/warn "Missing user context for role check")
          (response/status (response/response {:error "Authentication required"}) 401))))))

(defn wrap-require-admin
  "Middleware that requires user to be admin"
  [handler]
  (wrap-require-role handler :admin))

;; ============================================================================
;; Request Context Utilities
;; ============================================================================

(defn get-user
  "Get user from request context"
  [request]
  (:user request))

(defn get-user-id
  "Get user ID from request context"
  [request]
  (when-let [user (:user request)]
    (:user-id user)))

(defn get-user-role
  "Get user role from request context"
  [request]
  (when-let [user (:user request)]
    (keyword (:role user))))

(defn authenticated?
  "Check if request is authenticated"
  [request]
  (some? (:user request)))

(defn has-role?
  "Check if user has a specific role"
  [request role]
  (= (get-user-role request) role))

(defn owns-resource?
  "Check if user owns a resource (user-id matches)"
  [request resource-user-id]
  (= (get-user-id request) resource-user-id))

;; ============================================================================
;; Error Response Helpers
;; ============================================================================

(defn unauthorized-response
  "Return 401 unauthorized response"
  [message]
  (response/status (response/response {:error message}) 401))

(defn forbidden-response
  "Return 403 forbidden response"
  [message]
  (response/status (response/response {:error message}) 403))

(defn bad-request-response
  "Return 400 bad request response"
  [message]
  (response/status (response/response {:error message}) 400))
