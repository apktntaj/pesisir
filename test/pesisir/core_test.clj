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

(deftest auth-register-not-impl
  (let [response (routes/register-handler {})]
    (is (= 501 (:status response)))))

(deftest auth-login-not-impl
  (let [response (routes/login-handler {})]
    (is (= 501 (:status response)))))
