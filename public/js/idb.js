let db;

// establish a connection to IndexDB database called "budget-tracker" and set it to version 1
const request = indexedDB.open("budget-tracker", 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore("new_transaction", {autoIncrement: true});
};

request.onsuccess = function(event) {
    db = event.target.result
    if (navigator.online) {
        uploadTransaction();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// will be executed if you attempt to submit a new transaction and there's no internet connection
function saveRecord(record) {
    const transaction = db.transaction(["new_transaction"], "readwrite");

    const transactionObjectStore = transaction.objectStore("new_transaction");
    
    // add new record to the store with add method
    transactionObjectStore.add(record);
}

function uploadTransaction() {
    // open a transaction on the database
    const transaction = db.transaction(["new_transaction"], "readwrite");

    //access the object store
    const  transactionObjectStore = transaction.objectStore("new_transaction");

    // get all records from the store and set to a variable
    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch("/api/transaction", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */* ",
                    "Content-Type": "application/json"
                }
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // open one more transaction
                    const transaction = db.transaction(["new_transaction"], "readwrite");

                    // access the new transaction object store
                    const transactionObjectStore = transaction.objectStore("new_transaction");

                    // clear all items in your store
                    transactionObjectStore.clear();

                    alert("All saved transactions have been submit!");
                })
                .catch(err => {
                    console.log(err);
                })
            });
        }
    };

}
// listen for the app to come back online
window.addEventListener("online", uploadTransaction);