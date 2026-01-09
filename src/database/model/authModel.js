module.exports = (sequelize,DataTypes) => {
    const User = sequelize.define('auth',{
        id:{
            primaryKey:true,
            type:DataTypes.UUID,
            defaultValue:DataTypes.UUIDV4
        },
        email:{
            type:DataTypes.STRING,
            allowNull:false,
            unique:true
        },
        password:{
            type:DataTypes.STRING,
            allowNull:false,
        },
        username:{
            type:DataTypes.STRING,
            allowNull:false
        },

    })
    return User
}