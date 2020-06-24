module.exports = function(sequelize, DataTypes) {
    global.User = sequelize.define("User", {
      ipfs: DataTypes.STRING,
      name: DataTypes.STRING,
      type: DataTypes.INTEGER, //1 for Service Provider and 2 for Consumer
      bio: DataTypes.STRING ,
      publicKey: DataTypes.STRING,
      filehash: DataTypes.STRING,
      rating:DataTypes.STRING,
      ratinghash:DataTypes.STRING
    })
    return User
}