const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");

module.exports = {
  entry: {
    popup: path.resolve("src/popup/index.tsx"),
    options: path.resolve("src/options/index.tsx"),
    prompt: path.resolve("src/prompt/index.tsx"),
    background: path.resolve("src/background/background.js"),
  },
  devtool: "eval-source-map",
  module: {
    rules: [
      {
        use: "ts-loader",
        test: /\.tsx?$/,
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
            },
          },
          {
            loader: "postcss-loader", // postcss loader needed for tailwindcss
            options: {
              postcssOptions: {
                ident: "postcss",
                plugins: [tailwindcss, autoprefixer],
              },
            },
          },
        ],
      },
      {
        type: "assets/resource",
        test: /\.(png|jpg|jpeg|gif|woff|woff2|tff|eot|svg)$/,
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve("src/static"),
          to: path.resolve("dist"),
        },
        {
          from: "node_modules/webextension-polyfill/dist/browser-polyfill.min.js",
          to: "browser-polyfill.js",
        },
      ],
    }),
    ...getHtmlPlugins(["popup", "options", "prompt"]),
  ],
  resolve: {
    extensions: [".tsx", ".js", ".ts"],
  },
  output: {
    filename: "[name].js",
    path: path.join(__dirname, "dist"),
  },
  optimization: {
    // splitChunks: {
    //   chunks: "all",
    // },
    runtimeChunk: false,
  },
};

function getHtmlPlugins(chunks) {
  return chunks.map(
    (chunk) =>
      new HtmlPlugin({
        title: "React Extension",
        filename: `${chunk}.html`,
        chunks: [chunk],
      })
  );
}
