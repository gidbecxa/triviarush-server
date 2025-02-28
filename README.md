# **TriviaRush**  

**TriviaRush** is a real-time multiplayer trivia game where players compete against real opponents in different categories. The game features duo-player mode, customizable game settings, and a social component where players can add game pals for frequent challenges.  

## **Key Features**  

- 🎮 **Real-Time Multiplayer:** Play against real players in different trivia categories.  
- 🔄 **Dynamic Questions:** Questions are served in real-time with response time tracking.  
- ⚡ **Performance Tracking:** Players’ scores and response times are recorded and updated in real-time via WebSockets.  
- 🎨 **Customizable Settings:** Players can adjust game preferences, including sound settings, notifications, and language.  
- 🤝 **Social Play:** Add game pals and challenge them in duo-player mode.  
- 🔒 **Security Features:** Manage account security settings, including 2FA and multi-device login.  
- 🎵 **Sound Customization:** Enable/disable game music and sound effects and choose preferred background music styles.  

## **Technology Stack**  

- **Frontend:** React Native (Expo 51) with NativeWind and Expo Router 3.5  
- **Backend:** Node.js with NestJS and Prisma  
- **Database:** PostgreSQL with JSON-based user settings storage  
- **Real-Time Communication:** WebSockets for multiplayer game sync  
- **Storage:** Supabase for media storage  
- **Authentication & Security:** SecureStore for local settings, 2FA (coming soon)  

## **Game Flow**  

1. Players join or create a trivia game room.  
2. Questions are served, and response time is tracked.  
3. Scores are updated and emitted via WebSockets.  
4. The leading player is displayed dynamically.  
5. The winner is determined at the end of the game.  

## **How to Run the Project**  

1. Clone the repository:  
   ```bash
   git clone https://github.com/yourusername/triviarush.git
   cd triviarush
   ```
2. Install dependencies:  
   ```bash
   npm install
   ```  
3. Start the frontend:  
   ```bash
   expo start
   ```  
4. Start the backend:  
   ```bash
   npm run start:dev
   ```  

## **Upcoming Features**  

- 🎭 Special game modes  
- 📊 In-depth stats and leaderboards  
- 🏆 Player achievements and rewards  
- 📅 Daily and weekly challenges  

---

This README gives a clear and structured overview of the game. Let me know if you want any modifications! 🚀
