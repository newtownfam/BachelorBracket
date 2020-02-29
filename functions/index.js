const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp();
db = admin.firestore();


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

function calcPickPts() { //calculates points per pick (50/# women left)
    var pts = 0;
    var numWomen = 0;
    var remWomen = [];

    //loop through women and incr count for each remaining
    let query = db.collection("women").where('week', '==', 100).get()
        .then(snapshot => {
            if (snapshot.empty) {
                console.log('No matching documents.');
                return;
            }

            snapshot.forEach(doc => {
                numWomen++;
                remWomen.push(doc.id)
            });

            pts = 50 / numWomen;
            return pts, remWomen;

        })
        .catch(err => {
            console.log('Error getting documents', err);
        });
    
}

    

function calcUserScores(pts, remWomen) {//loop through users and update scores
    var score = 0;
    var numCorrect = 0;

    var query = firebase.database().ref('users').orderByKey();
    query.once("value")//database
        .then(function (snapshot) {//users
            snapshot.forEach(function (childSnapshot) {//individual user (julien, pete, i.e.)
                for(var cd in childSnapshot.child("picks")){//for each woman

                    var pickName = cd.child("name").val();//get womans name
                    for(var name in remWomen){
                        if(name == pickName){
                            numCorrect += 1;
                        }
                    }

                }
            })
        })


    //Calculate score
    score = numCorrect * pts;


    return score;
}

exports.onScoringUpdate = functions.firestore
    .document('admin/{adminID}')
    .onUpdate((change, context) => {

        console.log('running calcPickPts function....');
        var ptsPerPick, remWomen = calcPickPts();

        //get users weekly score
        console.log('running calcUserScoresFn');
        var score = calcUserScores(ptsPerPick, remWomen);


        //update score
        var admin = require("firebase-admin");
        var db = admin.database();
        var ref = db.ref("users");
        var i = 0
        for(var cd in ref){
            var prevScores = cd.child("scores").val();
            console.log(prevScores)
            prevScores.push(score[i])
            cd.update({
                points: [prevScores],
                total: prevScores.reduce((a, b) => a + b, 0)
            });
            i += 1;
        }
        
        return null
})
