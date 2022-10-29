const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//Validation middleware
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

function priceValidation(req, res, next) {
    const { data = {} } = req.body
    if (data.price <= 0 || typeof data.price !== "number") {
        return next({
            status: 400,
            message: "Dish must include a price"
        })
    } next()

}

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
function list(req, res, next) {
    res.json({ data: dishes })
}

function read(req, res, next) {
    res.json({ data: res.locals.foundDish })
}

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