(ns pesisir.routes
  "API route handlers"
  (:require [pesisir.db :as db]
            [taoensso.timbre :as log]))

;; Health Check Route

(defn health
  "GET /health - Health check endpoint"
  [_request]
  (let [db-health (db/health-check)
        status (if (= :healthy (:status db-health)) 200 503)
        response (assoc db-health :timestamp (str (:timestamp db-health)))]
    {:status status
     :body response}))

;; Auth Routes (placeholder for Sprint 1)

(defn register-handler
  "POST /api/auth/register - User registration"
  [_request]
  {:status 501
   :body {:error "Not yet implemented"
          :message "User registration will be implemented in Sprint 1"}})

(defn login-handler
  "POST /api/auth/login - User login"
  [_request]
  {:status 501
   :body {:error "Not yet implemented"
          :message "User login will be implemented in Sprint 1"}})

(def auth-routes
  "Authentication routes"
  ["" {:tags ["auth"]}
   ["/register" {:post register-handler}]
   ["/login" {:post login-handler}]])
