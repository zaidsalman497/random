import { Handler } from "@netlify/functions";

const facts = [
  "The first video game ever made was Tennis for Two in 1958.",
  "The original name for Pac-Man was Puck-Man.",
  "Minecraft is the best-selling video game of all time with over 300 million copies sold.",
  "The first Easter egg in a video game was hidden in the 1980 Atari game Adventure.",
  "Nintendo was founded in 1889 as a playing card company.",
  "The longest Monopoly game ever played lasted 70 straight days.",
  "The fear of video games is called Ludectrophobia.",
  "Mario was named after Nintendo's landlord, Mario Segale.",
  "The PS1's startup sound was designed to be intimidating to pirates.",
  "Lara Croft from Tomb Raider was originally going to be named Laura Cruz."
];

const handler: Handler = async () => {
  const randomFact = facts[Math.floor(Math.random() * facts.length)];

  return {
    statusCode: 200,
    body: JSON.stringify({ fact: randomFact }),
  };
};

export { handler };
