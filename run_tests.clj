(require '[clojure.test :as t]
         '[pesisir.core-test])

(println "Running tests...")
(let [results (t/run-tests 'pesisir.core-test)]
  (println "\nTest Results:")
  (println (str "Tests: " (:test results)))
  (println (str "Assertions: " (:assertion results)))
  (println (str "Failures: " (:fail results)))
  (println (str "Errors: " (:error results)))
  (System/exit (if (zero? (+ (:fail results) (:error results))) 0 1)))
