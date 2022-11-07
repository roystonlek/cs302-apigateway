import { GraphQLError } from "graphql";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { AssetsAPI } from "./assets-api.js";
import { RequestsAPI } from "./requests-api.js";
import { UsersAPI } from "./users-api.js";
import { ClaimsAPI } from "./claims-api.js";

import axios from "axios";
import cors from "cors";
import express from "express";
import { expressMiddleware } from "@apollo/server/express4";
import http from "http";
import pkg from 'body-parser';
const { json } = pkg;
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { resolve } from "dns";
import rabbit from './publisher.js';


// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.
  type Query {
    assets: [Asset]
    assetById(id: ID!): Asset
    assetByType(type: String!): [Asset]
    assetByClub(club: String!): [Asset]
    }

  type Mutation {
      addAsset(asset: AssetInput!): Asset
      updateAsset(id: ID!, asset: AssetInput): Asset!
      loanAsset(id: ID!, asset: AssetInput): Asset!
      deleteAsset(id: ID!): Boolean!
  }

  type Asset {
      id: ID!
      serialNo: String!
      description: String!
      assetType: String!
      loanUser: String
      club: String
  }

  input AssetInput {
      id: ID
      serialNo: String
      description: String
      assetType: String
      loanUser: String
      club: String
  }


#Request 

  type Query {
    requests: [Request]
    requestById(id: ID!): Request
    requestsByClub(club: String!): [Request]
    requestsByAssetName(assetName: String!): [Request]
}

  type Mutation {
    addRequest(request: RequestInput!): Request
    updateRequest(id: ID!, request: RequestInput): Request!
    approveRequest( email:String! , id: ID!, request: RequestInput): Request!
    deleteRequest(id: ID!): Boolean!
  }

  type Request {
    requestId: ID!
    assetName: String!
    assetId: String!
    remarks: String
    club:String
    purpose: String
    reqUser: String!
    approved: Boolean!
    requestDate: String!
    collectionDateTime: String
}

  input RequestInput {
    requestId: ID
    assetName: String
    assetId: String
    remarks: String
    club:String
    purpose: String
    reqUser: String
    requestDate: String
    collectionDateTime: String
    approved: Boolean
  }

#User for auth and user data 

  type Query {
    users: [User]
    user(id: String!): User
    userByClub(club: String!): [User]
  }

  type Mutation {
    login(user: UserInput!): User
    addUser(user: UserInput!): User
    updateUser(id: ID!, user: UserInput): User!
    deleteUser(id: ID!): Boolean!
  }
  
  type User {
    id: String!
    email: String!
    password: String
    fullName: String!
    club: String!
    role: String!
  }
  input UserInput {
    id: String
    email: String
    password: String
    fullName: String
    club: String
    role: String
  }

  #claim queries
    type Claim{
        claim_id: ID!
        club_name: String!
        claimant_name: String!
        items: String!
        claim_amount: Float!
        claim_docs: String!
        status: String!
        remarks: String
    }
    input ClaimInput{
        claim_id: ID
        club_name: String
        claimant_name: String 
        items: String
        claim_amount: Float
        claim_docs: String
        status: String
        remarks: String
    }
    type Query {
        claims: [Claim]
        claimById(id: ID!): Claim
    }
    type Mutation {
        addClaim(claim: ClaimInput!): Claim
        updateClaim(email:String!, id: ID!, claim: ClaimInput): Claim!
        deleteClaim(id: ID!): Claim
    }

`;

// Resolvers define how to fetch the types defined in your schema.
// This resolver retrieves books from the "books" array above.
const resolvers = {
    Query: {
        // assets
        assetById: async (_, { id }, { dataSources }) => {
            return dataSources.assetsAPI.getAsset(id);
        },
        assets: async (_, __, { user, dataSources }) => {
            return dataSources.assetsAPI.getAllAssets();
        },
        assetByType: async (_, { type }, { dataSources }) => {
            return dataSources.assetsAPI.getAssetsByType(type);
        },
        assetByClub: async (_, { club }, { dataSources }) => {
            return dataSources.assetsAPI.getAssetsByClub(club);
        },

        //Requests
        requestById: async (_, { id }, { dataSources }) => {
            return dataSources.requestsAPI.getRequest(id);
        },
        requests: async (_, __, { user, dataSources }) => {
            if (
                user == undefined ||
                !(user.role.includes("Admin") || user.role.includes("Exco"))
            ) {
                throw new GraphQLError(
                    "You are not authorized to view this resource",
                    {
                        extensions: {
                            code: "UNAUTHORIZED",
                            http: { status: 403 },
                        },
                    }
                );
            }
            return dataSources.requestsAPI.getAllRequests();
        },
        requestsByClub: async (_, { club }, { user, dataSources }) => {
            return dataSources.requestsAPI.getRequestByClub(club);
        },
        requestsByAssetName: async (
            _,
            { assetName },
            { user, dataSources }
        ) => {
            if (
                user == undefined ||
                !(user.role.includes("Admin") || user.role.includes("Exco"))
            ) {
                throw new GraphQLError(
                    "You are not authorized to view this resource",
                    {
                        extensions: {
                            code: "UNAUTHORIZED",
                            http: { status: 403 },
                        },
                    }
                );
            }
            return dataSources.requestsAPI.getRequestByAssetName(assetName);
        },
        //users resolvers
        users: (_, __, { user, dataSources }) => {
            if (user == undefined || !user.role.includes("Admin")) {
                throw new GraphQLError(
                    "You are not authorized to view this resource",
                    {
                        extensions: {
                            code: "UNAUTHORIZED",
                            http: { status: 403 },
                        },
                    }
                );
            }
            return dataSources.usersAPI.getAllUsers();
        },
        user: async (_, { id }, { dataSources }) => {
            return dataSources.usersAPI.getUser(id);
        },
        userByClub: async (_, { club }, { user, dataSources }) => {
            if (
                user == undefined ||
                !(user.role.includes("Admin") || user.role.includes("Exco"))
            ) {
                throw new GraphQLError(
                    "You are not authorized to view this resource",
                    {
                        extensions: {
                            code: "UNAUTHORIZED",
                            http: { status: 403 },
                        },
                    }
                );
            }
            return dataSources.usersAPI.getUserByClub(club);
        },
        //claims resolvers
        claims: async (_, __, { user, dataSources }) => {
            if (user == undefined || !user.role.includes("Admin")) {
                throw new GraphQLError(
                    "You are not authorized to view this resource",
                    {
                        extensions: {
                            code: "UNAUTHORIZED",
                            http: { status: 403 },
                        },
                    }
                );
            }
            return dataSources.claimsAPI.getAllClaims();
        },
        claimById: async (_, { id }, { user, dataSources }) => {
            if (
                user == undefined ||
                !(user.role.includes("Admin") || user.role.includes("Exco"))
            ) {
                throw new GraphQLError(
                    "You are not authorized to view this resource",
                    {
                        extensions: {
                            code: "UNAUTHORIZED",
                            http: { status: 403 },
                        },
                    }
                );
            }
            return dataSources.claimsAPI.getClaim(id);
        },
    },
    Mutation: {
        addAsset: async (_, { asset }, { user, dataSources }) => {
            if (
                user == undefined ||
                !(user.role.includes("Admin") || user.role.includes("Exco"))
            ) {
                console.log(user.role);
                throw new GraphQLError(
                    "You are not authorized to view this resource",
                    {
                        extensions: {
                            code: "UNAUTHORIZED",
                            http: { status: 403 },
                        },
                    }
                );
            }
            return dataSources.assetsAPI.addAsset(asset);
        },
        updateAsset: async (_, { id, asset }, { user, dataSources }) => {
            if (
                user == undefined ||
                !(user.role.includes("Admin") || user.role.includes("Exco"))
            ) {
                throw new GraphQLError(
                    "You are not authorized to view this resource",
                    {
                        extensions: {
                            code: "UNAUTHORIZED",
                            http: { status: 403 },
                        },
                    }
                );
            }
            return dataSources.assetsAPI.updateAsset(id, asset);
        },
        loanAsset: async (_, { id, asset }, { user, dataSources }) => {
            if (user == undefined || !user.role.includes("Exco")) {
                throw new GraphQLError(
                    "You are not authorized to view this resource",
                    {
                        extensions: {
                            code: "UNAUTHORIZED",
                            http: { status: 403 },
                        },
                    }
                );
            }
            return dataSources.assetsAPI.loanAsset(id, asset);
        },
        deleteAsset: async (_, { id }, { user, dataSources }) => {
            if (
                user == undefined ||
                !(user.role.includes("Admin") || user.role.includes("Exco"))
            ) {
                throw new GraphQLError(
                    "You are not authorized to view this resource",
                    {
                        extensions: {
                            code: "UNAUTHORIZED",
                            http: { status: 403 },
                        },
                    }
                );
            }
            return dataSources.assetsAPI.deleteAsset(id);
        },
        //request
        addRequest: async (_, { request }, { dataSources }) => {
            return dataSources.requestsAPI.addRequest(request);
        },
        updateRequest: async (_, { id, request }, { dataSources }) => {
            return dataSources.requestsAPI.updateRequest(id, request);
        },
                //after approving send the email 
        approveRequest: async (_, { email ,id, request }, { rabbit , user, dataSources }) => {
            console.log("index");
            if (
                user == undefined ||
                !(user.role.includes("Admin") || user.role.includes("Exco"))
            ) {
                throw new GraphQLError(
                    "You are not authorized to view this resource",
                    {
                        extensions: {
                            code: "UNAUTHORIZED",
                            http: { status: 403 },
                        },
                    }
                );
            }
            const result = await dataSources.requestsAPI.approveRequest(id, request);
            console.log("result is here "+result);
            console.log(JSON.stringify(result));
            var emails = `{"email": "${email}" , "status": "approved" , "type":"request" , "data":${JSON.stringify(result)}}`
            console.log(emails);
            rabbit.sendMsg("notifications.topic", "claims.test",emails);
            return dataSources.requestsAPI.approveRequest(id, request);
        },
        deleteRequest: async (_, { id }, { dataSources }) => {
            return dataSources.requestsAPI.deleteRequest(id);
        },
        //user
        login: async (_, { user }, { dataSources }) => {
            return dataSources.usersAPI.login(user);
        },
        addUser: async (_, { user }, { dataSources }) => {
            return dataSources.usersAPI.addUser(user);
        },
        updateUser: async (_, { id, user }, { dataSources }) => {
            return dataSources.usersAPI.updateUser(id, user);
        },
        deleteUser: async (_, { id }, { dataSources }) => {
            return dataSources.usersAPI.deleteUser(id);
        },
        //claims
        addClaim: async (_, { claim }, { user, dataSources }) => {
            if (
                user == undefined ||
                !(user.role.includes("Admin") || user.role.includes("Exco"))
            ) {
                throw new GraphQLError(
                    "You are not authorized to view this resource",
                    {
                        extensions: {
                            code: "UNAUTHORIZED",
                            http: { status: 403 },
                        },
                    }
                );
            }
            return dataSources.claimsAPI.addClaim(claim);
        },
        updateClaim: async (_, {email, id, claim }, { user, dataSources }) => {
            if (
                user == undefined ||
                !(user.role.includes("Admin") || user.role.includes("Exco"))
            ) {
                throw new GraphQLError(
                    "You are not authorized to view this resource",
                    {
                        extensions: {
                            code: "UNAUTHORIZED",
                            http: { status: 403 },
                        },
                    }
                );
            }
            console.log("index")
            const result = await dataSources.claimsAPI.updateClaim(id, claim);
            console.log("result is here "+result);
            console.log(JSON.stringify(result));
            var emails = `{"email": "${email}" , "status": "approved" , "type":"claim" ,"data":${JSON.stringify(result)}}`
            console.log(emails);
            rabbit.sendMsg("notifications.topic", "claims.test",emails);
            return dataSources.claimsAPI.updateClaim(id, claim);
        },
        deleteClaim: async (_, { id }, { user, dataSources }) => {
            if (
                user == undefined ||
                !(user.role.includes("Admin") || user.role.includes("Exco"))
            ) {
                throw new GraphQLError(
                    "You are not authorized to view this resource",
                    {
                        extensions: {
                            code: "UNAUTHORIZED",
                            http: { status: 403 },
                        },
                    }
                );
            }
            return dataSources.claimsAPI.deleteClaim(id);
        },
    },
};

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.

// const server = new ApolloServer({
//     typeDefs,
//     resolvers,
// });

// Passing an ApolloServer instance to the `startStandaloneServer` function:
//  1. creates an Express app
//  2. installs your ApolloServer instance as middleware
//  3. prepares your app to handle incoming requests
async function getUser(token, body) {
    // /login
    var details = token.split(" ")[1];
    var username = details.split(":")[0];
    var password = details.split(":")[1];
    // console.log(username, password);
    return axios
        // .post("http://13.213.102.107:30000/login", {
        .post("http://localhost:8082/login", {
            id: username,
            password: password,
        })
        .then((response) => {
            return response.data;
        })
        .catch((error) => {
            console.log(error.message);
        });
}

const app = express();
const httpServer = http.createServer(app);
const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

await server.start();

app.use(
    cors(),
    json(),
    expressMiddleware(server, {
        context: async ({ req }) => {
            const { cache } = server;
            // console.log(req.headers)


            const token = req.headers.authorization || "";
            const body = req.body;
            // need to implement this user
            // console.log(token);
            // console.log(token);
            const check = getUser(token, body).then((response) => {
                if (!response)
                    // throwing a `GraphQLError` here allows us to specify an HTTP status code,
                    // standard `Error`s will have a 500 status code by default
                    throw new GraphQLError("Authentication Error", {
                        extensions: {
                            code: "UNAUTHENTICATED",
                            http: { status: 401 },
                        },
                    });
                    const user = response;
                return {
                    rabbit,
                    user,
                    dataSources: {
                        assetsAPI: new AssetsAPI({ cache }),
                        requestsAPI: new RequestsAPI({ cache }),
                        usersAPI: new UsersAPI({ cache }),
                        claimsAPI: new ClaimsAPI({ cache }),
                    },
                };
            });
            return check;
        },
        // listen: { port: process.env.PORT || 4000 },
    })
);

await new Promise((resolve) => httpServer.listen({port: process.env.PORT || 4000 }, resolve));
// const { url } = await startStandaloneServer(server, {
//     context: async ({ req }) => {
//         const { cache } = server;
//         // console.log(req.headers)
//         const token = req.headers.authorization || "";
//         const body = req.body;
//         // need to implement this user
//         // console.log(token);
//         console.log(token);
//         const check = getUser(token,body).then((response) => {
//             if (!response)
//                 // throwing a `GraphQLError` here allows us to specify an HTTP status code,
//                 // standard `Error`s will have a 500 status code by default
//                 throw new GraphQLError("Authentication Error", {
//                     extensions: {
//                         code: "UNAUTHENTICATED",
//                         http: { status: 401 },
//                     },
//                 });
//             const user = response;
//             return {
//                 user,
//                 dataSources: {
//                     assetsAPI: new AssetsAPI({ cache }),
//                     requestsAPI: new RequestsAPI({ cache }),
//                     usersAPI: new UsersAPI({ cache }),
//                     claimsAPI: new ClaimsAPI({ cache }),
//                 },
//             };
//         });
//         return check;
//     },
//     listen: { port: process.env.PORT||4000 },
// });

//following the way of youtube

console.log(`🚀  Server ready at: ${resolve}`);
