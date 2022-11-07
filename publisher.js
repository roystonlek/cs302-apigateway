// import amqps from 'amqplib';

// // console.log(amqp);
// const connect = amqps.connect;
// console.log(connect);
// connect("amqps://cs302:cs302cs302cs302@b-54a42d72-60ab-458f-abfb-2b375f984910.mq.ap-southeast-1.amazonaws.com:5671", (err, conn) => {
//     console.log("Connected to Rabbitmq");
//     if (err) {
//         throw err;
//     }
//     conn.createChannel((err, ch) => {
//         if(err){
//             console.log(err);
//         }
//         const q = "Claim_Notifications";
//         ch.assertQueue(q, { durable: false });
//         ch.sendToQueue(q, Buffer.from("Hello World!"));
//         console.log(" [x] Sent 'Hello World!'");
//     });
//     setTimeout(() => {
//         conn.close();
//         process.exit(0);
//     }, 1000);
// });

// import rabbit from "./rabbitmq.js";

// rabbit.InitConnection(() => {
//     // start Publisher when the connection to rabbitmq has been made
//     console.log("HHIHIHI ");
//     rabbit.StartPublisher();
//     // rabbit.PublishMessage("Claim_Notifications", "claims.test", `{"email": "roystonishappy@gmail.com" ,"status": "approved", "type":"request" , "data": "objectmodel here "}`);
// });

// setTimeout(() => {
//     // We send a message to queue
//     rabbit.PublishMessage(
//         "notifications.topic",
//         "claims.test",
//         `{"email": "roystonishappy@gmail.com" , "status": "approved"}`
//     );
// }, 6000);
// We wait 6 seconds after send a message to queue. ONLY FOR TEST PURPOSES

import amqp from "amqplib/callback_api.js";

export default {
    sendMsg: (exchange, routingKey, content, options = {}) => {
        amqp.connect(
            "amqps://cs302:cs302cs302cs302@b-54a42d72-60ab-458f-abfb-2b375f984910.mq.ap-southeast-1.amazonaws.com:5671",
            (err, conn) => {
                // console.log("Connected to Rabbitmq");
                // If connection error
                if (err) {
                    console.error("[AMQP]", err.message);
                    return setTimeout(this, 1000);
                }
                console.log("[AMQP] connected");
                const message = Buffer.from(content, "utf-8");
                console.log(message);
                // Execute finish function
                conn.createConfirmChannel(function (error, ch) {
                    if (err) {
                        console.log(err);
                        throw error;
                    }
                    // Set publisher channel in a var
                    console.log("[AMQP] Publisher started");

                    try {
                        // Publish message to exchange
                        // options is not required
                        ch.publish(
                            exchange,
                            routingKey,
                            message,
                            options,
                            (err) => {
                                if (err) {
                                    console.error("[AMQP] publish", err);
                                    ch.connection.close();
                                    return;
                                }
                                console.log("[AMQP] message delivered");
                                return;
                            }
                        );
                    } catch (e) {
                        console.error("[AMQP] publish", e.message);
                    }
                });
                setTimeout(function () {
                    conn.close();
                }, 10000);
            }
        );
    },
};
