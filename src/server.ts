import "dotenv/config";
import app from "./app";
import { connectDatabase, disconnectDatabase } from "./config/database";

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    await disconnectDatabase();
    process.exit(1);
  }
}

void bootstrap();
