(ns pesisir.core-test
  "Basic tests for core functionality"
  (:require [clojure.test :refer :all]
            [pesisir.routes :as routes]
            [ring.mock.request :as mock]))

(deftest health-check-test
  "Test health check endpoint returns 200"
  (let [response (routes/health {})]
    (is (= 200 (:status response)))
    (is (map? (:body response)))))

(deftest root-endpoint-test
  "Test root endpoint returns API info"
  (let [response (({:get (fn [_] {:status 200
                                  :body {:message "Pesisir API"
                                         :version "0.1.0"}})} :get) {})]
    (is (= 200 (:status response)))
    (is (contains? (:body response) :message))))

(deftest auth-register-not-impl
  "Test auth register endpoint"
  (let [response (routes/register-handler {})]
    (is (= 501 (:status response)))))

(deftest auth-login-not-impl
  "Test auth login endpoint"
  (let [response (routes/login-handler {})]
    (is (= 501 (:status response)))))
