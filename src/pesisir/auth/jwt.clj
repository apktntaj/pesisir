(ns pesisir.auth.jwt
  "JWT token generation and verification"
  (:require [buddy.sign.jwt :as jwt]
            [java-time :as jt]))

;; ============================================================================
;; Constants
;; ============================================================================

(def TOKEN_EXPIRATION_HOURS 24)
"JWT token expiration time in hours"

(def REFRESH_TOKEN_EXPIRATION_DAYS 30)
"Refresh token expiration time in days"

(def RESET_TOKEN_EXPIRATION_HOURS 1)
"Password reset token expiration time in hours"

(def VERIFICATION_TOKEN_EXPIRATION_HOURS 24)
"Email verification token expiration time in hours"

;; JWT secret key - should be loaded from environment
(defn get-secret []
  (or (System/getenv "JWT_SECRET")
      "dev-secret-change-in-production"))

;; ============================================================================
;; Token Claims
;; ============================================================================

(defn create-token
  "Create a JWT token for user
   Returns map with :token and :expires-at"
  [user-id user-email user-role]
  {:pre [(integer? user-id) (string? user-email) (keyword? user-role)]}
  (let [now (jt/instant)
        expires-at (jt/plus now (jt/hours TOKEN_EXPIRATION_HOURS))
        claims {:user-id user-id
                :email user-email
                :role (name user-role)
                :type "access"
                :iat (quot (System/currentTimeMillis) 1000)
                :exp (quot (.toEpochMilli expires-at) 1000)}
        token (jwt/sign claims (get-secret) {:alg :hs256})]
    {:token token
     :expires-at expires-at
     :expires-in-seconds (quot (.toEpochMilli expires-at) 1000)}))

(defn create-refresh-token
  "Create a refresh token for user
   Returns map with :token and :expires-at"
  [user-id]
  {:pre [(integer? user-id)]}
  (let [now (jt/instant)
        expires-at (jt/plus now (jt/days REFRESH_TOKEN_EXPIRATION_DAYS))
        claims {:user-id user-id
                :type "refresh"
                :iat (quot (System/currentTimeMillis) 1000)
                :exp (quot (.toEpochMilli expires-at) 1000)}
        token (jwt/sign claims (get-secret) {:alg :hs256})]
    {:token token
     :expires-at expires-at
     :expires-in-seconds (quot (.toEpochMilli expires-at) 1000)}))

(defn create-reset-token
  "Create a password reset token
   Returns map with :token and :expires-at"
  [user-id user-email]
  {:pre [(integer? user-id) (string? user-email)]}
  (let [now (jt/instant)
        expires-at (jt/plus now (jt/hours RESET_TOKEN_EXPIRATION_HOURS))
        claims {:user-id user-id
                :email user-email
                :type "reset"
                :iat (quot (System/currentTimeMillis) 1000)
                :exp (quot (.toEpochMilli expires-at) 1000)}
        token (jwt/sign claims (get-secret) {:alg :hs256})]
    {:token token
     :expires-at expires-at}))

(defn create-verification-token
  "Create an email verification token
   Returns map with :token and :expires-at"
  [user-id user-email]
  {:pre [(integer? user-id) (string? user-email)]}
  (let [now (jt/instant)
        expires-at (jt/plus now (jt/hours VERIFICATION_TOKEN_EXPIRATION_HOURS))
        claims {:user-id user-id
                :email user-email
                :type "verification"
                :iat (quot (System/currentTimeMillis) 1000)
                :exp (quot (.toEpochMilli expires-at) 1000)}
        token (jwt/sign claims (get-secret) {:alg :hs256})]
    {:token token
     :expires-at expires-at}))

;; ============================================================================
;; Token Verification
;; ============================================================================

(defn verify-token
  "Verify and parse a JWT token
   Returns claims map or nil if invalid"
  [token]
  (try
    (jwt/unsign token (get-secret) {:alg :hs256})
    (catch Exception e
      (println "Token verification failed:" (.getMessage e))
      nil)))

(defn verify-access-token
  "Verify an access token and check type
   Returns claims map or nil if invalid"
  [token]
  (when-let [claims (verify-token token)]
    (when (= (:type claims) "access")
      claims)))

(defn verify-refresh-token
  "Verify a refresh token and check type
   Returns claims map or nil if invalid"
  [token]
  (when-let [claims (verify-token token)]
    (when (= (:type claims) "refresh")
      claims)))

(defn verify-reset-token
  "Verify a password reset token and check type
   Returns claims map or nil if invalid"
  [token]
  (when-let [claims (verify-token token)]
    (when (= (:type claims) "reset")
      claims)))

(defn verify-verification-token
  "Verify an email verification token and check type
   Returns claims map or nil if invalid"
  [token]
  (when-let [claims (verify-token token)]
    (when (= (:type claims) "verification")
      claims)))

;; ============================================================================
;; Token Extraction from Request
;; ============================================================================

(defn extract-token
  "Extract JWT token from Authorization header
   Expects format: 'Bearer <token>'"
  [request]
  (when-let [auth-header (get-in request [:headers "authorization"])]
    (when (re-matches #"^Bearer\s+.+$" auth-header)
      (second (re-matches #"^Bearer\s+(.+)$" auth-header)))))

(defn extract-bearer-token
  "Extract and verify token from request
   Returns claims map or nil"
  [request]
  (when-let [token (extract-token request)]
    (verify-access-token token)))

;; ============================================================================
;; Token Utilities
;; ============================================================================

(defn token-valid?
  "Check if a token is currently valid (not expired)"
  [token token-type]
  (case token-type
    :access (some? (verify-access-token token))
    :refresh (some? (verify-refresh-token token))
    :reset (some? (verify-reset-token token))
    :verification (some? (verify-verification-token token))
    false))

(defn get-token-expiration
  "Get expiration time for token type in hours"
  [token-type]
  (case token-type
    :access TOKEN_EXPIRATION_HOURS
    :refresh (quot (* REFRESH_TOKEN_EXPIRATION_DAYS 24) 1)
    :reset RESET_TOKEN_EXPIRATION_HOURS
    :verification VERIFICATION_TOKEN_EXPIRATION_HOURS
    nil))
