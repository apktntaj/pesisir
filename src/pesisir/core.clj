(ns pesisir.core
  "Main entry point for Pesisir application"
  (:require [pesisir.server :as server]
            [pesisir.db :as db]
            [taoensso.timbre :as log])
  (:gen-class))

(defn -main
  "Main entry point - starts the application"
  [& args]
  (let [port (or (some-> (first args) Integer/parseInt)
                 (some-> (System/getenv "PORT") Integer/parseInt)
                 3000)]
    (log/info (str "Pesisir starting on port " port))
    (try
      (server/start-server! port)
      (log/info "Pesisir is running!")
      @(promise)
      (catch Exception e
        (log/error "Failed to start:" e)
        (System/exit 1)))))

;; REPL utilities
(defn dev-start [] (server/start-server! 3000))
(defn dev-stop [] (server/stop-server!))
(defn dev-restart [] (server/restart-server! 3000))
(defn db-health [] (db/health-check))
(defn db-config [] (db/get-db-spec))
