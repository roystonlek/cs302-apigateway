import { RESTDataSource } from '@apollo/datasource-rest';
import rabbit from './rabbitmq.js';

export class RequestsAPI extends RESTDataSource {
  constructor() {
    // Always call super()
    super();
    // Sets the base URL for the REST API
    // this.baseURL = 'http://13.213.102.107:30001/';
    this.baseURL = 'http://localhost:8081/';
  }

  async getRequest(id) {
    // Send a GET request to the specified endpoint
    return this.get(`requests/${id}`);
  }

  async getAllRequests() {
    return this.get(`requests`)
  }

  async getRequestByAssetName(assetName){
    return this.get(`requests/assetName/${assetName}`);
  }
  async getRequestByClub(club){
    return this.get(`requests/club/${club}`);
  }

  async addRequest(request) {
    var requestJson = JSON.parse(JSON.stringify(request))
    return this.post(
        `requests`, 
        { body: requestJson }
    )
  }

  async updateRequest(id, request){
    var requestJson = JSON.parse(JSON.stringify(request))
    return this.put(
        `requests/${id}`, 
        { body: requestJson }
    )
  }
  async approveRequest(id, request){
    var requestJson = JSON.parse(JSON.stringify(request))
    console.log(requestJson);
    return this.put(
        `requests/approve/${id}`, 
        { body: requestJson }
    )
    // const ret = this.put(
    //     `requests/approve/${id}`, 
    //     { body: requestJson }
    // )
  }

  async deleteRequest(id){
    return this.delete(`requests/${id}`)
  }

  
}