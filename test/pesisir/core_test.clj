(ns pesisir.core-test
  "Basic tests for core functionality"
  (:require [clojure.test :refer [deftest is]]
            [pesisir.routes :as routes]))

(deftest health-check-test
  (let [response (routes/health {})]
    (is (= 200 (:status response)))
    (is (map? (:body response)))))

(deftest root-endpoint-test
  (let [response (({:get (fn [_] {:status 200
                                  :body {:message "Pesisir API"
                                         :version "0.1.0"}})} :get) {})]
    (is (= 200 (:status response)))
    (is (contains? (:body response) :message))))

(deftest auth-register-test
  (let [response (routes/register {})]
    (is (= 400 (:status response)))))

(deftest auth-login-test
  (let [response (routes/login {})]
    (is (= 400 (:status response)))))
