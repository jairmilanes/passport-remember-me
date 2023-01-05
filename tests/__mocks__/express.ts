

export class Response {
    clearCookie = jest.fn();

    cookie = jest.fn();

    redirect = jest.fn()
}

export class Request {
    res = new Response()

    user = {
        id: ""
    };

    body = {}

    isAuthenticated = jest.fn()

    cookies = {}

    logout = jest.fn().mockImplementation((cb) => {
        if (cb) cb();
    })
}