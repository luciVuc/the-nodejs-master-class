# Homework Assignment 1

A simple "Hello World" API that listens on a port 3000.

## Syntax

[`http://localhost:3000/hello?name=<nameValue>`](http://localhost:3000/hello?name=)

## Response

```json
  {
      "message": "Hello <nameValue>. The current date and time is <date> <time>."
  }
```

## Usage

When the user posts a request to the route '/hello', passing a value for the 'name' parameter , it returns a welcome message in JSON format containing the given 'name' parameter along with the current date and time. Example:

[`/hello?name=John`](http://localhost:3000/hello?name=John)

When the user posts a request to the route '/hello', without passing a value for the 'name' parameter , it returns a welcome message, in JSON format, containing the value 'User' for the 'name' parameter along with the current date and time. Example:

[`/hello`](http://localhost:3000/hello)

or

[`/hello?name=John`](http://localhost:3000/hello?name=)

or

[`/hello?id=0`](http://localhost:3000/hello?id=0)
