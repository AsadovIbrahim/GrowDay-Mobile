/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
       
        "redditsans-black": ["RedditSans-Black"],
        "redditsans-bold": ["RedditSans-Bold"],
        "redditsans-regular": ["RedditSans-Regular"],
        "redditsans-medium": ["RedditSans-Medium"],


        "sf-bold": ["SFPRODISPLAYBOLD"],
        "sf-regular": ["SFPRODISPLAYREGULAR"],
      }
    },
  },
  plugins: [],
}