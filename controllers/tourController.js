const fs = require('fs');

let tours = fs.readFileSync('./dev-data/data/tours-simple.json', 'utf-8', (error) => {
  if (error) return console.log(error.message)
});

tours = JSON.parse(tours)

const checkID = (req, res, next, val) => {
  if (tours.length < req.params.id * 1) {
    return res.status(404).json({
      status: "fail",
      message: 'Invalid ID'
    })
  }
  next();
}

const checkForReuqestBody = (req, res, next) => {
  if (!Object.entries(req.body).length){
    return res.status(404).json({
      status: "fail",
      message: 'POST does not have incoming body'
    })
  }
  next();
}

const getAlltours = (req, res) => {
  console.log(req.requestTime)

  res.status(200).json({
    status: "success",
    results: tours.length,
    requetsedAt: req.requestTime,
    data: {
      tours: tours
    }
  })
}

const getTour = (req, res) => {
  let tour = tours.find(el => {
    return el.id === req.params.id * 1
  });

  res.status(200).json({
    status: "success",
    data: {
      tour
    }
  })
}

const createTour = (req, res) => {
  const newId = tours.length;
  const newTour = Object.assign({id: newId}, req.body);

  tours.push(newTour);

  fs.writeFile('./dev-data/data/tours-simple.json', JSON.stringify(tours), 'utf-8', (error) => {
    if (error) return console.log(error.message)
    res.status(201).json({
    status: 'success',
    data: {
      tour: newTour
    }
  })
})
}

const updateTour = (req, res) => {
  let tour = tours.find(el => {
    return el.id === req.params.id * 1
  });

  tour = Object.assign({}, tour, req.body);
  tours.splice(req.params.id, 1, tour);

  fs.writeFile('./dev-data/data/tours-simple.json', JSON.stringify(tours), 'utf-8', (error) => {
    if(error) return console.log(error.message)

    res.status(200).json({
      status: "success",
      data: {
        tour
      }
    })
  })
}

const deleteTour = (req, res) => {
  let tour = tours.find(el => {
    return el.id === req.params.id * 1
  });

  if (!tour) {
    res.status(404).json({
      status: "fail",
      message: 'Invalid ID'
    })
  } else {
    tours.splice(req.params.id * 1, 1)

    fs.writeFile('./dev-data/data/tours-simple.json', JSON.stringify(tours), 'utf-8', (error) => {
      if (error) return console.log(error.message)

      res.status(204).json({
      status: "success",
      data: null
    })
  })
  }
}

module.exports = { getAlltours, getTour, createTour, updateTour, deleteTour, checkID, checkForReuqestBody }