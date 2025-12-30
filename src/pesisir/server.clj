(ns pesisir.server
  "HTTP Server setup with Ring and Reitit"
  (:require [ring.adapter.jetty :as jetty]
            [reitit.ring :as ring]
            [ring.middleware.cors :as cors]
            [taoensso.timbre :as log]
            [pesisir.routes :as routes]
            [pesisir.auth.middleware :as auth-mw]
            [pesisir.db :as db]
            [cheshire.core :as json]))

(defn wrap-json-response
  "Wrap response to add Content-Type json header"
  [handler]
  (fn [request]
    (let [response (handler request)]
      (if (map? (:body response))
        (-> response
            (assoc :body (json/generate-string (:body response)))
            (update :headers #(assoc % "Content-Type" "application/json")))
        response))))

(defn cors-middleware
  "Configure CORS for API"
  [handler]
  (cors/wrap-cors handler
    :access-control-allow-origin #".*"
    :access-control-allow-methods [:get :put :post :delete :options]
    :access-control-allow-headers ["Content-Type" "Authorization"]))

(defn app-routes
  "Define all application routes"
  []
  [["/" {:get (fn [_] {:status 200
                       :body {:message "Pesisir API"
                              :version "0.1.0"}})}]
   ["/health" {:get routes/health}]
   ["/api" routes/auth-routes]
   ["/api" routes/user-routes]
   ["/api" routes/document-routes]])

(defn create-app
  "Create Ring application with middleware"
  []
  (-> (ring/ring-handler
        (ring/router (app-routes))
        (ring/routes
          (ring/redirect-trailing-slash-handler)
          (ring/create-default-handler)))
      wrap-json-response
      auth-mw/wrap-auth
      cors-middleware))

(defonce ^:private server (atom nil))

(defn start-server!
  "Start HTTP server"
  [port]
  (log/info (str "Starting server on port " port "..."))
  (try
    (let [app (create-app)
          jetty-server (jetty/run-jetty app
                         {:port port
                          :join? false
                          :host "0.0.0.0"})]
      (reset! server jetty-server)
      (log/info (str "✅ Server started on port " port))
      
      ;; Check database in background
      (future
        (Thread/sleep 500)
        (db/init-config!)
        (let [db-health (db/health-check)]
          (if (= :healthy (:status db-health))
            (log/info "✅ Database connection verified")
            (log/warn "⚠️  Database health check:" db-health))))
      
      jetty-server)
    (catch Exception e
      (log/error "Failed to start server:" e)
      (throw e))))

(defn stop-server!
  "Stop HTTP server"
  []
  (when @server
    (log/info "Stopping server...")
    (.stop @server)
    (reset! server nil)
    (log/info "Server stopped")))

(defn restart-server!
  "Restart HTTP server (useful for REPL development)"
  [port]
  (stop-server!)
  (start-server! port))
