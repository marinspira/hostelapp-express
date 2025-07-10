import Hostel from "../models/hostel.model.js";
import User from "../models/user.model.js"

export const getUsers = async (req, res) => {
    try {
        const users = await User.find(); 

        if (users.lenght > 0) {
            return res.status(400).json({
                success: true,
                message: "Any user registered.",
            });
        }

        const usersDto = users.map(user => ({
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            isNewUser: user.isNewUser
          }));

        return res.status(200).json({
            success: true,
            message: "",
            data: usersDto
        });
    } catch (error) {
        console.error("Error in getUsers controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const getUserStats = async (req, res) => {
  try {
    const users = await User.find();

    const totalUsers = users.length;

    const usersByRole = {};
    let newUsersCount = 0;
    const usersCreatedByMonth = {};
    let activeUsers = 0;
    const usersByStatus = {}; 

    const ACTIVE_DAYS_THRESHOLD = 30; // users updated within last 30 days are active
    const now = new Date();

    users.forEach(user => {
      // Count by role
      const role = user.role || 'unknown';
      usersByRole[role] = (usersByRole[role] || 0) + 1;

      // Count new users
      if (user.isNewUser) newUsersCount++;

      // Count active users (updated recently)
      if (user.updatedAt) {
        const updatedAt = new Date(user.updatedAt);
        const diffDays = (now - updatedAt) / (1000 * 60 * 60 * 24);
        if (diffDays <= ACTIVE_DAYS_THRESHOLD) activeUsers++;
      }

      // Users by status
      if (user.status) {
        usersByStatus[user.status] = (usersByStatus[user.status] || 0) + 1;
      }

      // Users created by month
      const createdAt = user.createdAt || user.created_at;
      if (createdAt) {
        const date = new Date(createdAt);
        const yearMonth = date.toISOString().slice(0, 7); // "YYYY-MM"
        usersCreatedByMonth[yearMonth] = (usersCreatedByMonth[yearMonth] || 0) + 1;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        usersByRole,
        newUsersCount,
        activeUsers,
        usersByStatus,
        usersCreatedByMonth,
      }
    });
  } catch (error) {
    console.error("Error in getUserStats:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const getHostelStats = async (req, res) => {
    try {
      const hostels = await Hostel.find();
  
      const totalHostels = hostels.length;
  
      const hostelsBySize = {
        small: 0,   // < 5 rooms
        medium: 0,  // 5 a 15 rooms
        large: 0    // > 15 rooms
      };
  
      const hostelsByPopularity = {
        low: 0,      // 0-5 guests
        medium: 0,   // 6-15 guests
        high: 0      // > 15 guests
      };
  
      let totalEvents = 0;
      const hostelsCreatedByMonth = {};
      const hostelsByCountry = {};
      const hostelsByCity = {};
      let totalRooms = 0;
      let hostelsWithVolunteers = 0;
      const hostelsByStatus = {};
  
      hostels.forEach(h => {
        const roomCount = h.rooms.length;
        totalRooms += roomCount;
  
        // Set size
        if (roomCount < 5) hostelsBySize.small++;
        else if (roomCount <= 15) hostelsBySize.medium++;
        else hostelsBySize.large++;
  
        // Popularity
        const guestsCount = h.user_id_guests.length;
        if (guestsCount <= 5) hostelsByPopularity.low++;
        else if (guestsCount <= 15) hostelsByPopularity.medium++;
        else hostelsByPopularity.high++;
  
        // Country
        const country = h.address?.country || 'Unknown';
        hostelsByCountry[country] = (hostelsByCountry[country] || 0) + 1;
  
        // City
        const city = h.address?.city || 'Unknown';
        hostelsByCity[city] = (hostelsByCity[city] || 0) + 1;
  
        // Experience with volunteers
        if (h.experience_with_volunteers) hostelsWithVolunteers++;
  
        // Status
        const status = h.status || 'unknown';
        hostelsByStatus[status] = (hostelsByStatus[status] || 0) + 1;

         // Event
      totalEvents += (h.events?.length || 0);

      // Creation by month
      const createdAt = h.createdAt || h.created_at;
      if (createdAt) {
        const date = new Date(createdAt);
        const yearMonth = date.toISOString().slice(0,7); // "YYYY-MM"
        hostelsCreatedByMonth[yearMonth] = (hostelsCreatedByMonth[yearMonth] || 0) + 1;
      }
      });
  
      const averageRooms = totalHostels ? totalRooms / totalHostels : 0;
  
      return res.status(200).json({
        success: true,
        data: {
          totalHostels,
          hostelsBySize,
          hostelsByPopularity,
          hostelsByCountry,
          hostelsByCity,
          averageRooms,
          hostelsWithVolunteers,
          hostelsByStatus
        }
      });
    } catch (error) {
      console.error('Error in getHostelStats:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  };

export const getHostels = async (req, res) => {
    try {
        const hostels = await Hostel.find();

        if (hostels.lenght > 0) {
            return res.status(400).json({
                success: true,
                message: "Any hostel registered.",
            });
        }

        const hostelsDTO = hostels.map(hostel => ({
            name: hostel.name,
            username: hostel.username,
            createdAt: hostel.createdAt,
            updatedAt: hostel.updatedAt,
          }));

        return res.status(200).json({
            success: true,
            message: "",
            data: hostelsDTO
        });
    } catch (error) {
        console.error("Error in getHostels controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}