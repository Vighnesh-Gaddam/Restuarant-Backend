class ApiResponse {
    constructor(statusCode, data = null, message = null) {
        this.statusCode = statusCode;
        this.success = statusCode < 400;
        this.message = message || (statusCode < 400 ? "Success" : "Error");
        this.data = data;
    }
}

export { ApiResponse };
