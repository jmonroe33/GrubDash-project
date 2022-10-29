const path = require("path");
// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));
// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");
// TODO: Implement the /orders handlers needed to make the tests pass

// Validation Middleware

function orderExists(req, res, next) {
    const { orderId } = req.params
    const foundOrder = orders.find(order => order.id === orderId)
    if (foundOrder) {
        res.locals.order = foundOrder
        res.locals.orderId = orderId
        return next()
    }
    next({
        status: 404,
        message: `get this order out my faceeeee ${orderId}`
    })
}

function dataHasProperty(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body
        if (data[propertyName]) {
            return next()
        }
        next({
            status: 400,
            message: `Order must include ${propertyName}`
        })
    }
}

function validateDishes(req, res, next) {
    const { data: { dishes } = {} } = req.body 

    if (!Array.isArray(dishes) || !dishes.length ) {
        next({
            status: 400,
            message: "Order must include at least one dish",
        })
    } else {
        for (let i = 0; i < dishes.length; i++) {
            let dish = dishes[i];
            if (!dish.quantity || typeof(dish.quantity) !== "number" || dish.quantity < 1 ) {
                next({
                    status: 400,
                    message: ` Dish ${i} must have a quantity that is an Integer greater that 0`
                }) 
            }             
        }
    }
    return next()
}

function validateUpdateStatus(req, res, next) {
    const { data: {status} = {} } = req.body

    if (status === "pending" || status === "preparing") {
        return next()
    }
    next({
        status: 400,
        message: "status is invalid for change"
    })
}

function validateDeleteStatus(req, res, next) {
    if (res.locals.order.status === "pending") {
        return next()
    }
    next({
        status: 400,
        message: "cannot delete an order that aint pending cuz"
    })
}

function validateId(req, res, next) {
    const { data = {} } = req.body
    if (!data.id || res.locals.orderId === data.id) {
        return next()
    }
    next({
        status: 400,
        message: `Order id does not match route id. Order: ${data.id}, Route: ${res.locals.orderId}`
    })
}

// RouteHandlers
function list(req, res, next) {
    const dishId = req.params.dishId
    res.json({ data: orders.filter(dishId ? order => order.id : () => true )})
}

function read(req, res, next) {
    res.json({ data: res.locals.order })
}

function create(req, res, next) {
    const { data: { deliverTo, mobileNumber, status = "pending", dishes } = {} } = req.body

    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes,
    } 
    orders.push(newOrder)
    res.status(201).json({ data: newOrder })
}

function update(req, res, next) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body

    res.locals.order.deliverTo = deliverTo
    res.locals.order.mobileNumber = mobileNumber
    res.locals.order.status = status
    res.locals.order.dishes = dishes

    res.json({ data: res.locals.order })
}

function destroy(req, res, next) {
    const orderId = res.locals.orderId
    const index = orders.findIndex(order => order.id === orderId)
    if (index > -1) {
        orders.splice(index, 1)
    }
    res.sendStatus(204)
}

module.exports = {
    list,
    read: [orderExists, read],
    create: [
        dataHasProperty("deliverTo"),
        dataHasProperty("mobileNumber"),
        dataHasProperty("dishes"),
        validateDishes,
        create,
    ],
    update: [
        orderExists,
        validateUpdateStatus,
        dataHasProperty("deliverTo"),
        dataHasProperty("mobileNumber"),
        dataHasProperty("dishes"),
        dataHasProperty("status"),
        validateDishes,
        validateId,
        update,
    ],
    destroy: [orderExists, validateDeleteStatus, destroy]

}