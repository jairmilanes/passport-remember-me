
export class Request {
    res = new Response()

    user = {
        id: ""
    };

    isAuthenticated = jest.fn()

    cookies = {}
}

export class Response {
    clearCookie = jest.fn();

    cookie = jest.fn();
}
