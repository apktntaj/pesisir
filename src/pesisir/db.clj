(ns pesisir.db
  "Database connection and utilities"
  (:require [clojure.java.jdbc :as jdbc]
            [aero.core :as aero]
            [clojure.java.io :as io]
            [taoensso.timbre :as log]))

(defonce ^:private db-config (atom nil))

(defn- load-config
  "Load application configuration from resources/config.edn"
  []
  (aero/read-config (io/resource "config.edn")))

(defn init-config!
  "Initialize configuration"
  []
  (reset! db-config (load-config)))

(defn get-config
  "Get current configuration"
  []
  (if @db-config
    @db-config
    (do
      (init-config!)
      @db-config)))

(defn get-db-spec
  "Get database specification for jdbc operations"
  []
  (let [config (get-config)
        db-url (get-in config [:database :url])]
    {:dbtype "postgresql"
     :dbname "pesisir_dev"
     :host "localhost"
     :port 5432
     :user "pesisir"
     :password "dev"
     :url db-url
     :connect-timeout 5000}))

(defn execute!
  "Execute SQL query"
  [sql & params]
  (try
    (let [db (get-db-spec)]
      (apply jdbc/execute! db sql params))
    (catch Exception e
      (log/error "Database error:" e)
      (throw e))))

(defn query
  "Execute SELECT query
   Usage: (query \"SELECT * FROM users WHERE id = ?\" [1])
   Or: (query [\"SELECT * FROM users WHERE id = ?\" 1])"
  ([sql-params]
   ;; sql-params is already a vector like [\"SELECT...\" param1 param2]
   (try
     (let [db (get-db-spec)]
       (jdbc/query db sql-params))
     (catch Exception e
       (log/error "Database query error:" e)
       (throw e))))
  ([sql params]
   ;; sql is string, params is vector of parameters
   (query (into [sql] params))))

(defn insert!
  "Insert a row into table"
  [table row]
  (try
    (let [db (get-db-spec)]
      (jdbc/insert! db table row))
    (catch Exception e
      (log/error "Database insert error:" e)
      (throw e))))

(defn update!
  "Update rows in table"
  [table set-map where-clause]
  (try
    (let [db (get-db-spec)]
      (jdbc/update! db table set-map where-clause))
    (catch Exception e
      (log/error "Database update error:" e)
      (throw e))))

(defn get-by-id
  "Get single record by ID"
  [table id]
  (first (query (str "SELECT * FROM " (name table) " WHERE id = ?") [id])))

(defn health-check
  "Check database connectivity"
  []
  (try
    (let [start (System/currentTimeMillis)
          _ (query ["SELECT 1"])
          elapsed (- (System/currentTimeMillis) start)]
      {:status :healthy
       :timestamp (java.time.Instant/now)
       :latency-ms elapsed})
    (catch Exception e
      (log/error "Database health check failed:" e)
      {:status :unhealthy
       :error (str e)
       :timestamp (java.time.Instant/now)})))
