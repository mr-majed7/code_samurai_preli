const Train = require('../models/Trains');
const User = require('../models/Users');
const Station = require('../models/Stations');

async function addTrain(req, res,next){
    try {
        const train = new Train(req.body);
        const result = await train.save();
        const stops = result.stops;
        const length = stops.length;
        console.log(length)
        res.status(201).json({
            "train_id": result.train_id,
            "train_name": result.train_name,
            "capacity": result.capacity,
            "service_starts": result.stops[0].departure_time,
            "service_ends": result.stops[length-1].arrival_time,
            "num_station": length
        });
    } catch (error) {
        next(error);
    }
}

async function getBalance(req, res, next) {
    try {
        const user = await User.findOne({user_id: req.params.id});
       if (!user) {
           const error = new Error(`wallet with id ${req.params.id} was not found`);
            error.status = 404;
            throw error;

       }else{
              res.status(200).json({
               "waller_id": user.user_id,
                "balance": user.balance,
                "wallet_user":
                {
                    "user_id": user.user_id,
                    "user_name": user.user_name

                }
              });
       }
    } catch (error) {
        next(error);
    }
}

async function addBalance(req, res, next) {
    try {
        const user = await User.findOne({user_id: req.params.id});
        if (!user) {
            const error = new Error(`wallet with id: ${req.params.id} was not found`);
            error.status = 404;
            throw error;
        }else if (req.body.recharge < 100 || req.body.recharge > 10000) {
            const error = new Error(`"invalid amount: ${req.body.recharge}`);
            error.status = 400;
            throw error;
        }else{
            user.balance += req.body.recharge;
            const result = await user.save();
            res.status(200).json({
                "wallet_id": result.user_id,
                "wallet_balance": result.balance,
                "wallet_user":
                {
                    "user_id": result.user_id,
                    "user_name": result.user_name
                }
            });
        }
    }catch (error) {
        next(error);
    }
}

class PriorityQueue {
    constructor(comparator = (a, b) => a - b) {
        this.comparator = comparator;
        this.elements = [];
    }

    enqueue(element) {
        this.elements.push(element);
        this.elements.sort(this.comparator);
    }

    dequeue() {
        return this.elements.shift();
    }

    isEmpty() {
        return this.elements.length === 0;
    }
}


function findTrainConnecting(station, distances, graph) {
    // Find the train used to reach this station from its parent in the path.
    const parent = distances.get(station);
    if (!parent) {
      return null; // Start station doesn't have a train
    }
  
    for (const [neighbor, train] of graph[parent]) {
      if (neighbor === station) {
        return train;
      }
    }
  
    return null; // Should not reach here if path is valid
}

function getNextArrivalTime(departureTime, train, station) {
    // Get the departure time of the train from the previous station
    const prevStop = train.stops.find(stop => stop.station_id === station);
    if (!prevStop) {
        return null; // This shouldn't happen if the graph is constructed properly
    }
    
    const departureTimestamp = new Date(departureTime);
    const arrivalTimestamp = new Date(prevStop.departure_time);

    // Assume a fixed travel time for simplicity (can be adjusted based on actual train schedules)
    const travelTime = 60 * 60 * 1000; // 1 hour in milliseconds

    // Calculate the next arrival time based on departure time and travel time
    const nextArrivalTimestamp = new Date(arrivalTimestamp.getTime() + travelTime);
    return nextArrivalTimestamp.toISOString();
}


async function purchaseTicket(req, res, next) {
    const { wallet_id, time_after, station_from, station_to } = req.body;

    const user = await User.find({ user_id: wallet_id});
    if (!user) {
        return res.status(400).json({ message: 'Invalid wallet ID' });
    }

    const balance = user.balance;
    console.log(typeof(balance))

    // Find optimal itinerary using Dijkstra's algorithm
    const itinerary = await findOptimalItinerary(station_from, station_to, time_after); // Await here

    if (!itinerary) {
        return res.status(403).json({ message: 'No ticket available for this route' });
    }

    // Calculate ticket cost based on the chosen itinerary
    const ticketCost = await calculateTicketCost(itinerary); // Also await here

    if (ticketCost > balance) {
        return res.status(402).json({ message: `Recharge amount: ${ticketCost - balance} to purchase the ticket` });
    }

    // Update user balance (assuming you have a `decreaseBalance` method in your User model)
    await user.decreaseBalance(ticketCost);

    // Generate unique ticket ID (use your preferred method)
    const ticketId = Math.random().toString(36).substring(2, 15); // Example

    // Respond with successful purchase details
    res.status(201).json({
        ticket_id: ticketId,
        wallet_id,
        balance: user.balance,
        stations: itinerary.map(station => ({
        station_id: station.station_id,
        train_id: station.train.id,
        arrival_time: station.arrivalTime,
        departure_time: station.departureTime,
        })),
    });
}


async function findOptimalItinerary(station_from, station_to, time_after) {
    // Use Dijkstra's algorithm to find the cheapest path,
    // adapting it to handle train schedules and arrival times.
  
    // Create a graph:
    const station = await Station.find();
    const train = await Train.find();
    const graph = createGraph(station, train); // Assumes `stations` and `trains` are loaded
  
    // Initialize distances and visited stations:
    const distances = new Map();
    const visited = new Set();
  
    distances.set(station_from, 0); // Start from initial station with fare 0
  
    // Priority queue for unvisited stations with lowest estimated cost:
    const pq = new PriorityQueue((a, b) => distances.get(a) - distances.get(b));
    pq.enqueue(station_from);
  
    while (!pq.isEmpty()) {
      const current = pq.dequeue();
  
      if (current === station_to) {
        return reconstructItinerary(current, distances, graph); // Found!
      }
  
      if (visited.has(current)) {
        continue; // Already visited
      }
  
      visited.add(current);
  
      for (const neighbor of graph[current]) {
        const nextStation = neighbor[0];
        const train = neighbor[1];
        const nextArrivalTime = getNextArrivalTime(distances.get(current), train, nextStation); // Consider arrival time
  
        if (nextArrivalTime && nextArrivalTime >= time_after) {
          const tentativeFare = distances.get(current) + neighbor[2]; // Fare for this edge
  
          if (!distances.has(nextStation) || tentativeFare < distances.get(nextStation)) {
            distances.set(nextStation, tentativeFare);
            pq.enqueue(nextStation);
          }
        }
      }
    }
  
    return null; // No itinerary found within constraints
  }
  
  function createGraph(stations, trains) {
    // Create a graph representation where nodes are stations and edges are train connections.
    // Store fare and train info along with the edge.
    const graph = {};
    for (const station of stations) {
      graph[station._id] = []; // Initialize empty list of connections for each station
    }
  
    for (const train of trains) {
      for (let i = 0; i < train.stops.length - 1; i++) {
        const currentStop = train.stops[i];
        const nextStop = train.stops[i + 1];
        graph[currentStop.station_id].push([
          nextStop.station_id,
          train,
          currentStop.fare, // Fare is for the current-next stop segment
        ]);
      }
    }
  
    return graph;
  }
  
  function reconstructItinerary(station, distances, graph) {
    // Backtrack through the path to construct the itinerary.
    const stations = [];
    while (station) {
      stations.push({
        station_id: station,
        train_id: findTrainConnecting(station, distances, graph).train_id,
        arrival_time: getNextArrivalTime(distances.get(station.parent), station, station),
      });
      station = station.parent;
    }
    return stations.reverse();
  }
  
  function findTrainConnecting(station, distances, graph) {
    // Find the train used to reach this station from its parent in the path.
    const parent = station.parent;
    if (!parent) {
      return null; // Start station doesn't have a train
    }
  
    for (const [neighbor, train] of graph[parent]) {
      if (neighbor === station) {
        return train;
      }
    }
  
    return null; // Should not reach here if path is valid
  }

async function calculateTicketCost(itineraryPromise) {
    try {
      // Wait for the itinerary promise to resolve
      const itinerary = await itineraryPromise;
      
      // Check if itinerary is an array
      if (!Array.isArray(itinerary)) {
        // If itinerary is not an array, return 0 or handle the error accordingly
        return 0; // You can also throw an error here if necessary
      }
      
      // Sum the fares of each segment in the itinerary.
      return itinerary.reduce((total, station) => total + station.fare, 0);
    } catch (error) {
      console.error('Error calculating ticket cost:', error);
      return 0; // Return 0 or handle the error accordingly
    }
  }
  

module.exports = {
    addTrain,
    getBalance,
    addBalance,
    purchaseTicket
}

