let db;

// establish a connection to IndexDB database called "budget-tracker" and set it to version 1
const request = indexedDB.open("budget-tracker", version);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_addedTransaction', {autoIncrement: true});
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
    const transaction = db.transaction(["new_addedTransaction"], "readwrite");

    const addedTransactionObjectStore = transaction.objectStore("new_addedTransaction");
    
    // add new record to the store with add method
    addedTransactionObjectStore.add(record);
}

function uploadTransaction() {
    // open a transaction on the database
    const transaction = db.transaction(["new_addedTransaction"], "rewrite");

    //access the object store
    const  addedTransactionObjectStore = transaction.objectStore("new_addedTransaction");

    // get all records from the store and set to a variable
    const getAll = addedTransactionObjectStore.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
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
                    const transaction = db.transaction(["new_addedTransaction"], "rewrite");

                    // access the new transaction object store
                    const addedTransactionObjectStore = transaction.objectStore("new_addedTransaction");

                    // clear all items in your store
                    addedTransactionObjectStore.clear();

                    alert("All saved transactions have been submit!");
                })
                .catch(err => {
                    console.log(err);
                });
            });
        }
    };

}
// listen for the app to come back online
window.addEventListener("online", uploadTransaction);