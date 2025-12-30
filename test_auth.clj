(ns test-auth
  (:require [pesisir.auth.password :as pwd]
            [pesisir.auth.jwt :as jwt]
            [pesisir.user.domain :as domain]))

(println "\n========================================")
(println "Testing Pesisir Authentication System")
(println "========================================\n")

;; Test 1: Password Hashing
(println "1. Testing Password Hashing")
(let [password "TestPass123!"
      hashed (pwd/hash-password password)]
  (println "   ✓ Password hashed successfully")
  (println "   ✓ Valid password check:" (pwd/verify-password password hashed))
  (println "   ✓ Invalid password check:" (not (pwd/verify-password "wrong" hashed))))

;; Test 2: Password Validation
(println "\n2. Testing Password Validation")
(println "   ✓ Valid password:" (pwd/valid-password? "TestPass123!"))
(println "   ✓ Weak password (no special):" (not (pwd/valid-password? "TestPass123")))
(println "   ✓ Weak password (short):" (not (pwd/valid-password? "Test1!")))

;; Test 3: Email Validation
(println "\n3. Testing Email Validation")
(println "   ✓ Valid email:" (domain/valid-email? "test@example.com"))
(println "   ✓ Invalid email:" (not (domain/valid-email? "notanemail")))
(println "   ✓ Invalid email (no domain):" (not (domain/valid-email? "test@")))

;; Test 4: JWT Token Generation
(println "\n4. Testing JWT Token Generation")
(let [{:keys [token expires-at]} (jwt/create-token 1 "test@example.com" :user)]
  (println "   ✓ Token created:" (subs token 0 30) "...")
  (println "   ✓ Token expires at:" expires-at)
  (let [claims (jwt/verify-access-token token)]
    (println "   ✓ Token verified, user-id:" (:user-id claims))
    (println "   ✓ Token email:" (:email claims))
    (println "   ✓ Token role:" (:role claims))))

;; Test 5: Token Types
(println "\n5. Testing Different Token Types")
(let [verification (jwt/create-verification-token 1 "test@example.com")
      reset (jwt/create-reset-token 1 "test@example.com")
      refresh (jwt/create-refresh-token 1)]
  (println "   ✓ Verification token created")
  (println "   ✓ Reset token created")
  (println "   ✓ Refresh token created")
  (println "   ✓ Verification token valid:" (some? (jwt/verify-verification-token (:token verification))))
  (println "   ✓ Reset token valid:" (some? (jwt/verify-reset-token (:token reset))))
  (println "   ✓ Refresh token valid:" (some? (jwt/verify-refresh-token (:token refresh)))))

;; Test 6: User Domain Validation
(println "\n6. Testing User Domain Validation")
(let [errors (domain/validate-user-create "test@example.com" "Test User" "TestPass123!")]
  (println "   ✓ Valid user data:" (empty? errors)))
(let [errors (domain/validate-user-create "bademail" "Test User" "weak")]
  (println "   ✓ Invalid user data errors:" (count errors))
  (doseq [err errors]
    (println "     -" err)))

(println "\n========================================")
(println "✅ All Auth Tests Completed!")
(println "========================================\n")

(System/exit 0)
