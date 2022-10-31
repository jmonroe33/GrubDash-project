const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");


//Validation middleware

// checking to see if the dish requested exists
function dishExsists(req, res, next) {
    const  dishId  = req.params.dishId
    const foundDish = dishes.find((dish) => dish.id == dishId)
    
    if (foundDish) {     
        res.locals.foundDish = foundDish
        res.locals.dishId = dishId
        return next()
    }
    next({
        status: 404,
        message: `Dish id${req.params.dishId} does not exist`
    })
}

// middleware to check to make sure the price property is valid.
function priceValidation(req, res, next) {
    const { data = {} } = req.body
    if (data.price <= 0 || typeof data.price !== "number") {
        return next({
            status: 400,
            message: "Dish must include a price"
        })
    } next()

}

// middleware to check to make sure that each property that a client submits is valid.
function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body
        if (data[propertyName]) {
            return next()
        }
        next({
            status: 400,
            message: `Must include a ${propertyName}`
        })
    }
}
// checks if there is an id property inside of the put request and if there is one 
// checks to see if that id matches the dish id with the order id in the data object.
function validateId(req, res, next) {
    const { data = {} } = req.body
    if (!data.id || res.locals.dishId === data.id) {
        return next()
    }
    next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${data.id}, Route: ${res.locals.dishId}`
    })
}


// route handlers

// lists out each dish
function list(req, res, next) {
    res.json({ data: dishes })
}

// finds a specific dish based on the id found in the params
function read(req, res, next) {
    res.json({ data: res.locals.foundDish })
}

// creates a new dish object and stores it in the dishes array
function create(req, res, next) {
    const { data: { name, description, price, image_url } = {} } = req.body
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url,
    }
    dishes.push(newDish)
    res.status(201).json({ data: newDish })
}
// updates an existing dish with the new values recieved from the request body
function update(req, res, next) {
    const { data: { id, name, description, price, image_url } = {} } = req.body

    res.locals.foundDish.id = id
    res.locals.foundDish.name = name 
    res.locals.foundDish.description = description
    res.locals.foundDish.price = price
    res.locals.foundDish.image_url = image_url

    res.json({ data: res.locals.foundDish })
}


module.exports = {
    list,
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceValidation,
        create,
    ],
    read: [dishExsists, read],
    update: [
        dishExsists,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceValidation,
        validateId,
        update,
    ],
    dishExsists,
}