import { RESTDataSource } from "@apollo/datasource-rest";

export class AssetsAPI extends RESTDataSource {
    constructor() {
        // Always call super()
        super();
        // Sets the base URL for the REST API prod
        this.baseURL = "http://13.213.102.107:30002/";
        // dev
        // this.baseURL = "http://localhost:8080/";
    }

    async getAsset(id) {
        // Send a GET request to the specified endpoint
        return this.get(`assets/${id}`);
    }

    async getAllAssets() {
        return this.get(`assets`);
    }

    async getAssetsByType(asset_type){
      return this.get(`assets/type/${asset_type}`);
    }
    async getAssetsByClub(club){
      return this.get(`assets/club/${club}`);
    }

    async addAsset(asset) {
        var assetJson = JSON.parse(JSON.stringify(asset));
        return this.post(`assets`, { body: assetJson });
    }

    async updateAsset(id, asset) {
        var assetJson = JSON.parse(JSON.stringify(asset));
        return this.put(`assets/${id}`, { body: assetJson });
    }
    //loaning of asset once confirmed 
    async loanAsset(id, asset) {
        console.log("i reach here!");
        var assetJson = JSON.parse(JSON.stringify(asset));
        console.log(assetJson);
        return this.put(`assets/loan/${id}`, { body: assetJson });
    }

    async deleteAsset(id) {
        return this.delete(`assets/${id}`);
    }
}
