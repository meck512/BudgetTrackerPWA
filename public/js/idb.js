// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'budget-tracker' and set it to version 1
const request = indexedDB.open('budgetTracker', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (event) {
    // save a reference to the database 
    const db = event.target.result;
    // create an object store (table) called `budgetData`, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('budgetData', { autoIncrement: true });
};

// upon a successful 
request.onsuccess = function (event) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run syncBudget() function to send all local db data to api
    if (navigator.onLine) {
        syncBudget();
    }
};

request.onerror = function (event) {
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    const transaction = db.transaction(['budgetData'], 'readwrite');
    const budgetStorage = transaction.objectStore('budgetData');
    budgetStorage.add(record);
};

function syncBudget() {
    console.log('on-line!')
    // open a transaction on your pending db
    const transaction = db.transaction(['budgetData'], 'readwrite');
  
    // access your pending object store
    const budgetStorage = transaction.objectStore('budgetData');
  
    // get all records from store and set to a variable
    const getAll = budgetStorage.getAll();
  
    getAll.onsuccess = function() {
      // if there was data in indexedDb's store, let's send it to the api server
      if (getAll.result.length > 0) {
        fetch('/api/transaction/bulk', {
          method: 'POST',
          body: JSON.stringify(getAll.result),
          headers: {
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
          }
        })
          .then(response => response.json())
          .then(() => {
            const transaction = db.transaction(['budgetData'], 'readwrite');
            const budgetStorage = transaction.objectStore('budgetData');
            // clear all items in your store
            budgetStorage.clear();
          })
          .catch(err => {
            // set reference to redirect back here
            console.log(err);
          });
      }
    };
  }
  
  // listen for app coming back online
  window.addEventListener('online', syncBudget);
  