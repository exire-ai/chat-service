const plans = {
  getRecommended: function (userID, callback) {
    fetch(
      "https://exire-backend.herokuapp.com/plans/getRecommended/" + userID,
      {
        method: "GET",
      }
    )
      .then((response) => response.json())
      .then((responseJson) => {
        callback(responseJson);
        return null;
      })
      .catch((error) => {
        console.log(JSON.stringify(error));
        callback([]);
        return null;
      });
  },
};
