(ns pesisir.document.model-test
  "Tests for document domain models"
  (:require [clojure.test :refer :all]
            [pesisir.document.model :as model]))

(deftest test-valid-document-type
  (testing "Valid document types"
    (is (model/valid-document-type? :bill-of-lading))
    (is (model/valid-document-type? :commercial-invoice))
    (is (model/valid-document-type? :packing-list))
    (is (model/valid-document-type? "bill-of-lading")))
  
  (testing "Invalid document types"
    (is (not (model/valid-document-type? :invalid-type)))
    (is (not (model/valid-document-type? "random-doc")))))

(deftest test-valid-status
  (testing "Valid statuses"
    (is (model/valid-status? :uploaded))
    (is (model/valid-status? :extracting))
    (is (model/valid-status? :parsed))
    (is (model/valid-status? :completed))
    (is (model/valid-status? :failed)))
  
  (testing "Invalid statuses"
    (is (not (model/valid-status? :invalid-status)))))

(deftest test-valid-customs-type
  (testing "Valid customs document types"
    (is (model/valid-customs-type? :bc-1-1))
    (is (model/valid-customs-type? :bc-2-3))
    (is (model/valid-customs-type? :bc-3-0)))
  
  (testing "Invalid customs types"
    (is (not (model/valid-customs-type? :bc-4-0)))))

(deftest test-create-document
  (testing "Create document with valid data"
    (let [doc (model/create-document
               {:user-id 1
                :filename "test.pdf"
                :file-path "/uploads/test.pdf"
                :file-size 1024
                :document-type :bill-of-lading})]
      
      (is (= 1 (:user-id doc)))
      (is (= "test.pdf" (:original-filename doc)))
      (is (= "/uploads/test.pdf" (:file-path doc)))
      (is (= 1024 (:file-size doc)))
      (is (= :bill-of-lading (:document-type doc)))
      (is (= :uploaded (:status doc)))
      (is (nil? (:extracted-text doc)))
      (is (nil? (:parsed-data doc)))
      (is (some? (:created-at doc)))
      (is (some? (:updated-at doc))))))
