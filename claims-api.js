import { RESTDataSource } from "@apollo/datasource-rest";

export class ClaimsAPI extends RESTDataSource {
    constructor() {
        // Always call super()
        super();
        // Sets the base URL for the REST API
        this.baseURL = "http://18.142.162.74:31000/";
    }

    //specific claims
    async getClaim(id) {
        return this.get(`claims/${id}`);
    }
    // all claims
    async getAllClaims() {
        return this.get(`claims`);
    }
    //add claim
    async addClaim(claims) {
        var claimsJson = JSON.parse(JSON.stringify(claims));
        var value = this.post(`claims`, { body: claimsJson });
        console.log(value);
        return value;
    }
    //update claims
    async updateClaim(id, claims) {
        var claimsJson = JSON.parse(JSON.stringify(claims));
        return this.patch(`claims/${id}`, { body: claims });
    }
    //delete claims
    async deleteClaim(id) {
        return this.delete(`claims/${id}`);
    }
}
