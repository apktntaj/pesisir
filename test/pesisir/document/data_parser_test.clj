(ns pesisir.document.data-parser-test
  "Tests for data parsing functionality"
  (:require [clojure.test :refer :all]
            [pesisir.document.data-parser :as parser]))

(deftest test-extract-field
  (testing "Extract field with simple pattern"
    (let [text "Invoice Number: INV-12345"
          pattern #"Invoice Number:\s+([\w\d-]+)"
          result (parser/extract-field text pattern)]
      (is (= "INV-12345" result))))
  
  (testing "Extract field returns nil when not found"
    (let [text "Some random text"
          pattern #"Invoice Number:\s+([\w\d-]+)"
          result (parser/extract-field text pattern)]
      (is (nil? result)))))

(deftest test-parse-bill-of-lading
  (testing "Parse BOL with sample text"
    (let [text "B/L Number: MAEU123456789
                Vessel: MAERSK EDINBURGH
                Voyage: 123W
                Port of Loading: SINGAPORE
                Port of Discharge: JAKARTA
                Shipper: ABC Company
                Consignee: XYZ Ltd"
          result (parser/parse-bill-of-lading text)]
      
      (is (= :bill-of-lading (:document-type result)))
      (is (some? (:bl-number result)))
      (is (some? (:vessel-name result)))
      (is (some? (:port-of-loading result))))))

(deftest test-parse-commercial-invoice
  (testing "Parse CI with sample text"
    (let [text "Invoice Number: INV-2024-001
                Invoice Date: 01/12/2024
                Seller: Supplier Inc
                Buyer: Buyer Corp
                Total: USD 50,000.00
                Currency: USD
                Payment Terms: 30 Days
                Incoterms: FOB"
          result (parser/parse-commercial-invoice text)]
      
      (is (= :commercial-invoice (:document-type result)))
      (is (some? (:invoice-number result)))
      (is (some? (:seller result)))
      (is (some? (:buyer result))))))

(deftest test-calculate-confidence-score
  (testing "Calculate confidence with all fields filled"
    (let [data {:field1 "value1"
                :field2 "value2"
                :field3 "value3"}
          score (parser/calculate-confidence-score data)]
      (is (= 1.0 score))))
  
  (testing "Calculate confidence with some nil fields"
    (let [data {:field1 "value1"
                :field2 nil
                :field3 "value3"}
          score (parser/calculate-confidence-score data)]
      (is (> score 0.6))
      (is (< score 0.7))))
  
  (testing "Calculate confidence with all nil fields"
    (let [data {:field1 nil
                :field2 nil}
          score (parser/calculate-confidence-score data)]
      (is (= 0.0 score)))))
