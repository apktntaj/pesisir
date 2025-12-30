(ns pesisir.user.domain
  "User domain models and validation logic"
  (:require [clojure.spec.alpha :as s]
            [clojure.string :as str]))

;; ============================================================================
;; User Roles
;; ============================================================================

(def ROLES
  "Valid user roles for RBAC"
  #{:admin :user})

(def DEFAULT_ROLE :user)

;; ============================================================================
;; Email Validation
;; ============================================================================

(def EMAIL_REGEX
  "Email validation regex pattern"
  #"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")

(defn valid-email? [email]
  "Check if email format is valid"
  (and email
       (string? email)
       (< (count email) 255)
       (re-matches EMAIL_REGEX email)))

;; ============================================================================
;; Password Validation
;; ============================================================================

(defn valid-password? [password]
  "Check if password meets strength requirements:
   - At least 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one digit
   - At least one special character"
  (and password
       (string? password)
       (>= (count password) 8)
       (re-find #"[A-Z]" password)
       (re-find #"[a-z]" password)
       (re-find #"\d" password)
       (re-find #"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?]" password)))

(defn password-strength-requirements []
  "Return password requirements as map for documentation"
  {:min-length 8
   :requires-uppercase true
   :requires-lowercase true
   :requires-digit true
   :requires-special-char true})

;; ============================================================================
;; User Entity Specs
;; ============================================================================

(s/def ::id pos-int?)
(s/def ::email valid-email?)
(s/def ::name (s/and string? #(< 0 (count %) 255)))
(s/def ::password valid-password?)
(s/def ::hashed-password (s/and string? #(> (count %) 30)))
(s/def ::email-verified boolean?)
(s/def ::role (s/and keyword? ROLES))
(s/def ::created-at string?)
(s/def ::updated-at string?)
(s/def ::last-login (s/or :nil nil? :string string?))

;; User spec for creation
(s/def ::user-create
  (s/keys :req-un [::email ::name ::password]))

;; User spec for storage
(s/def ::user-stored
  (s/keys :req-un [::id ::email ::name ::hashed-password ::email-verified ::role ::created-at ::updated-at]
          :opt-un [::last-login]))

;; User spec for API response (no password)
(s/def ::user-response
  (s/keys :req-un [::id ::email ::name ::email-verified ::role ::created-at ::updated-at]
          :opt-un [::last-login]))

;; ============================================================================
;; User Construction
;; ============================================================================

(defn create-user
  "Create a new user entity (before hashing password and saving)
   Returns map with email, name, and password"
  [email name password]
  {:pre [(valid-email? email)
         (not (str/blank? name))
         (valid-password? password)]}
  {:email (str/lower-case email)
   :name (str/trim name)
   :password password})

(defn user->response
  "Convert stored user to API response format (remove sensitive data)"
  [user]
  (dissoc user :hashed-password :verification-token :reset-token))

;; ============================================================================
;; Validation Utilities
;; ============================================================================

(defn validate-user-create [email name password]
  "Validate user creation inputs, return errors or nil"
  (let [errors []]
    (cond-> errors
      (not (valid-email? email))
      (conj "Email format is invalid")
      
      (str/blank? name)
      (conj "Name is required")
      
      (> (count name) 255)
      (conj "Name must be less than 255 characters")
      
      (not (valid-password? password))
      (conj (format "Password must be at least 8 characters and contain uppercase, lowercase, digit, and special character")))))

(defn valid-user-create? [email name password]
  "Check if user creation inputs are valid"
  (empty? (validate-user-create email name password)))
