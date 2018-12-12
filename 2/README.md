# Homework Assignment 2

> The back-end API for a pizza-delivery app.

## Public Endpoints API

### Users

The `User` data type defines and implements the CRUD operations for users as well as the functionality to easily serialize/de-serialize, validate and manipulate the `user` data.

- **Create** - Creates and stores the information for a new user.

  - Path: `/users`

  - HTTP Method: `POST`

  - URL Parameters: *N/A*

  - Headers: *N/A*

  - Payload Data:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `email` | `String` | User ID |
    | `password` | `String` | User Password |
    | `tosAgreement` | `String` | ToS Agreement |
    | `firstName` | `String` | User's first name |
    | `lastName` | `String` | User's last name |
    | `streetAddress` | `String` | User's street address |

- **Read** - Reads and returns the information of a stored user.

  - Path: `/users`

  - HTTP Method: `GET`

  - URL Parameters:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `email` | `String` | User ID |

  - Headers:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `tokenid` | `String` | Token ID |

  - Payload Data: *N/A*

- **Update** - Updates or modifies an existing user.

  - Path: `/users`

  - HTTP Method: `PUT`

  - URL Parameters: *N/A*

  - Headers:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `tokenid` | `String` | Token ID |

  - Payload Data:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `email` | `String` | User ID |
    | `password` | `String` | User Password |
    | `firstName` | `String` | User's first name |
    | `lastName` | `String` | User's last name |
    | `streetAddress` | `String` | User's street address |
    | `cart` | `Object` | A JS object (hash-map) containing user's cart items, where the keys are item IDs and the values are the corresponding quantities. |
    | `orders` | `Array` | A JS array containing user's current order IDs. |

- **Delete** - Deletes an existing user and all its related data.

  - Path: `/users`

  - HTTP Method: `DELETE`

  - URL Parameters:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `email` | `String` | User ID |

  - Headers:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `tokenid` | `String` | Token ID |

  - Payload Data: *N/A*

- **Login** - Creates and returns an authentication token based on the given user email and password.

  - Path: `/user/login`

  - HTTP Method: `POST`

  - URL Parameters: *N/A*

  - Headers: *N/A*

  - Payload Data:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `email` | `String` | User ID |
    | `password` | `String` | User Password |

- **Logout** - Invalidates and removes the authentication token previously created based on the given user email and password.

  - Path: `/user/logout`

  - HTTP Method: `PUT`

  - URL Parameters: *N/A*

  - Headers: *N/A*

  - Payload Data:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `email` | `String` | User ID |
    | `password` | `String` | User Password |

- **Add Item To Cart** - Adds an item into the user's cart.

  - Path: `/user/addToCart`

  - HTTP Method: `PUT`

  - URL Parameters: *N/A*

  - Headers:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `tokenid` | `String` | Token ID |

  - Payload Data:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `email` | `String` | User ID |
    | `itemId` | `String` | Item ID |
    | `quantity` | `Number` | Item quantity |

- **Remove Item From Cart** - Removes an item from an user's cart.

  - Path: `/user/removeFromCart`

  - HTTP Method: `PUT`

  - URL Parameters: *N/A*

  - Headers:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `tokenid` | `String` | Token ID |

  - Payload Data:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `email` | `String` | User ID |
    | `itemId` | `String` | Item ID |

- **Empty Cart** - Removes all items from an user's cart.

  - Path: `/user/emptyCart`

  - HTTP Method: `PUT`

  - URL Parameters: *N/A*

  - Headers:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `tokenid` | `String` | Token ID |

  - Payload Data:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `email` | `String` | User ID |

- **Checkout** - Proceeds to checkout, placing an order with all items currently in user's cart.

  - Path: `/user/checkout`

  - HTTP Method: `PUT`

  - URL Parameters: *N/A*

  - Headers:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `tokenid` | `String` | Token ID |

  - Payload Data:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `email` | `String` | User ID |
    | `stripeToken` | `String` | A Stripe payment token. (For testing use one of these: `tok_visa`, `tok_visa_debit`, `tok_mastercard`, `tok_mastercard_debit`, `tok_mastercard_prepaid`, `tok_amex`, `tok_discover`, `tok_diners`, `tok_jcb`, `tok_unionpay`) |

### Items

The `Item` data type defines and implements the CRUD operations for items as well as the functionality to easily serialize/de-serialize, validate and manipulate the `item` data.

- **Read** - Reads and returns the information of a stored item.

  - Path: `/items`

  - HTTP Method: `GET`

  - URL Parameters:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `id` | `String` | The item id. If not provided, return the entire list of items |

  - Headers: *N/A*

  - Payload Data: *N/A*

### Tokens

The `Token` data type defines and implements the CRUD operations for authentication tokens, as well as the functionality to easily serialize/de-serialize, validate and manipulate the authentication `token` data.

- **Create** - Creates and stores the information for a new authentication token.

  - Path: `/tokens`

  - HTTP Method: `POST`

  - URL Parameters: *N/A*

  - Headers: *N/A*

  - Payload Data:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `email` | `String` | User ID |
    | `password` | `String` | User Password |

- **Read** - Reads and returns the information of a stored authentication token.

  - Path: `/tokens`

  - HTTP Method: `GET`

  - URL Parameters:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `tokenid` | `String` | Token ID |

  - Headers: *N/A*

  - Payload Data: *N/A*

- **Update** - Updates or modifies an existing authentication token.

  - Path: `/tokens`

  - HTTP Method: `PUT`

  - URL Parameters: *N/A*

  - Headers: *N/A*

  - Payload Data:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `id` | `String` | Token ID |
    | `extend` | `Boolean` | Whether to extend its validity or not |

- **Delete** - Deletes an existing authentication token and all its related data.

  - Path: `/tokens`

  - HTTP Method: `DELETE`

  - URL Parameters:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `tokenid` | `String` | Token ID |

  - Headers: *N/A*

  - Payload Data: *N/A*

### Orders

The `Order` data type defines and implements the CRUD operations for orders, as well as the functionality to easily serialize/de-serialize, validate and manipulate `order` data.

- **Create** - Creates and stores the information for a new order.

  - Path: `/orders`

  - HTTP Method: `POST`

  - URL Parameters: *N/A*

  - Headers: *N/A*

  - Payload Data:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `email` | `String` | User ID |
    | `items` | `Object` | A hash-map of key-value pairs, where the `key` is the `itemId` and the `value` is the quantity. |

- **Read** - Reads and returns the information of a stored order.

  - Path: `/orders`

  - HTTP Method: `GET`

  - URL Parameters:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `id` | `String` | Order ID |

  - Headers: *N/A*

  - Payload Data: *N/A*

- **Update** - Updates or modifies an existing order.

  - Path: `/orders`

  - HTTP Method: `PUT`

  - URL Parameters: *N/A*

  - Headers: *N/A*

  - Payload Data:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `email` | `String` | User ID |
    | `items` | `Object` | A hash-map of key-value pairs, where the `key` is the `itemId` and the `value` is the quantity. |
    | [`completedOn`] | `Number` | Completion date (in mill.)  |
    | [`paymentInfo`] | `Object` | Payment info |
    | [`total`] | `Number` | Total amount |

- **Delete** - Deletes an existing order and all its related data.

  - Path: `/orders`

  - HTTP Method: `DELETE`

  - URL Parameters:

    | Parameter | Type | Description |
    |-----------|------|-------------|
    | `id` | `String` | Order ID |

  - Headers: *N/A*

  - Payload Data: *N/A*
