import { RESTDataSource } from '@apollo/datasource-rest';

export class UsersAPI extends RESTDataSource {
  constructor() {
    // Always call super()
    super();
    // Sets the base URL for the REST API
    this.baseURL = 'http://localhost:8082/';
  }

  //havent implement yet 

  async getUser(id) {
    // Send a GET request to the specified endpoint
    return this.get(`users/${id}`);
  }

  async getAllUsers() {
    return this.get(`users`)
  }

  async getUserByClub(club){
    return this.get( `users/club/${club}`);
  }

  async addUser(user) {
    var userJson = JSON.parse(JSON.stringify(user))
    return this.post(
        `users`, 
        { body: userJson }
    )
  }

  async updateUser(id, user){
    var userJson = JSON.parse(JSON.stringify(user))
    return this.put(
        `users/${id}`, 
        { body: userJson }
    )
  }

  async deleteUser(id){
    return this.delete(`users/${id}`)
  }

  async login(user){
    console.log("login");
    var userJson = JSON.parse(JSON.stringify(user))
    console.log(userJson);
    return this.post(
        `/login`, 
        { body: userJson }
    )
  }


}