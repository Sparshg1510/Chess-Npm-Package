# ♟️ ChessSmash Pro — NPM Package (WIP)

    ChessSmash Pro is a Node.js module designed to help developers quickly build real-time multiplayer chess games, including:
    
      Turn validation
      
      Move syncing
      
      Player role management
      
      Lobby & seat assignment logic
      
      Game reset states
      
      Socket event helpers

    ⚠️ This package is still in early development (work in progress).
    New features, breaking changes, and API updates will be added continuously.

    🚧 Development Status: IN PROGRESS

Current state:

    Basic game logic using chess.js
    
    Player assignment system (white / black / spectator)
    
    Realtime move validation
    
    Lobby state management
    
    Disconnect & reconnection handling
    
    Server-side event structure

Upcoming:

    Typed API
    
    Spectator improvements
    
    Rematch system
    
    Multiplayer scaling
    
    Redis adapter support
    
    Database integration
    
    Documentation website
    
    Example full-stack implementation
    
    If you want something added, open an issue!

# 🚀 Features (Current)
    ✔ Real-time move validation
    
    Uses chess.js internally for legal move checking & FEN generation.
    
    ✔ Automatic player role assignment

Handles:

    First player random assignment
    
    Filling white/black seats
    
    Spectator overflow
