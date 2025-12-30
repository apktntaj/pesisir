(ns pesisir.auth.password
  "Password hashing and verification utilities using bcrypt"
  (:require [buddy.hashers :as hashers]))

;; ============================================================================
;; Constants
;; ============================================================================

(def BCRYPT_ALGORITHM :bcrypt+sha512)
"Bcrypt algorithm with SHA512 - recommended by buddy"

;; ============================================================================
;; Password Hashing
;; ============================================================================

(defn hash-password
  "Hash a plain text password using bcrypt
   Returns hashed password string"
  [password]
  {:pre [(string? password) (not (empty? password))]}
  (hashers/derive password {:alg BCRYPT_ALGORITHM}))

(defn verify-password
  "Verify a plain text password against a bcrypt hash
   Returns true if password matches, false otherwise"
  [password hashed]
  {:pre [(string? password) (string? hashed)]}
  (try
    (hashers/check password hashed)
    (catch Exception _
      false)))

;; ============================================================================
;; Password Validation
;; ============================================================================

(def PASSWORD_MIN_LENGTH 8)
(def PASSWORD_MAX_LENGTH 128)

(defn password-strength-message
  "Return detailed password strength feedback"
  [password]
  (let [errors []]
    (cond-> errors
      (or (nil? password) (empty? password))
      (conj "Password is required")
      
      (and password (< (count password) PASSWORD_MIN_LENGTH))
      (conj (format "Password must be at least %d characters" PASSWORD_MIN_LENGTH))
      
      (and password (> (count password) PASSWORD_MAX_LENGTH))
      (conj (format "Password must be less than %d characters" PASSWORD_MAX_LENGTH))
      
      (and password (not (re-find #"[A-Z]" password)))
      (conj "Password must contain at least one uppercase letter")
      
      (and password (not (re-find #"[a-z]" password)))
      (conj "Password must contain at least one lowercase letter")
      
      (and password (not (re-find #"\d" password)))
      (conj "Password must contain at least one digit")
      
      (and password (not (re-find #"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?]" password)))
      (conj "Password must contain at least one special character (!@#$%^&*()_+-=[]{}';:\"\\|,.<>/?)"))))

(defn valid-password?
  "Check if password meets all strength requirements"
  [password]
  (empty? (password-strength-message password)))

(defn password-requirements
  "Return password requirements as map for API documentation"
  []
  {:min-length PASSWORD_MIN_LENGTH
   :max-length PASSWORD_MAX_LENGTH
   :requires-uppercase true
   :requires-lowercase true
   :requires-digit true
   :requires-special-char true
   :special-chars "!@#$%^&*()_+-=[]{}';:\"\\|,.<>/?"})
