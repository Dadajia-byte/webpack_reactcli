const ESLintWebpackPlugin = require("eslint-webpack-plugin");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizer = require("css-minimizer-webpack-plugin");
const TerserWebpackPlugin = require("terser-webpack-plugin");
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");

// 获取cross-env定义的环境变量
const isProduction = process.env.NODE_ENV === "production";
/**
 *
 * @param {string} pre :传入需要的额外的样式loader
 * @returns :返回一个作为样式loaders的use数组
 */
function getStyleLoaders(pre) {
  const extractLoader = MiniCssExtractPlugin.loader;
  return [
    isProduction ? extractLoader : "style-loader", // 根据是否为生产模式判断用哪个loader
    "css-loader",
    {
      // 处理css兼容性问题
      // 配合package.json中的browserslist来制定兼容性
      loader: "postcss-loader",
      options: {
        postcssOptions: {
          plugins: ["postcss-preset-env"],
        },
      },
    },
    pre,
  ].filter(Boolean);
}
module.exports = {
  entry: "./src/main.js",
  output: {
    path: isProduction ? path.resolve(__dirname, "./dist") : undefined,
    filename: isProduction
      ? "static/js/[name].[contenthash:8].js"
      : "static/js/[name].js",
    chunkFilename: isProduction
      ? "static/js/[name].[contenthash:8].chunk.js"
      : "static/js/[name].chunk.js",
    assetModuleFilename: "static/media/[name].[hash:10][ext]",
    clean: true,
  },
  module: {
    rules: [
      // 处理css
      {
        test: /\.css$/,
        use: getStyleLoaders(),
      },
      {
        test: /\.less$/,
        use: getStyleLoaders("less-loader"),
      },
      {
        test: /\.s[ac]ss$/,
        use: getStyleLoaders("sass-loader"),
      },
      {
        test: /\.styl$/,
        use: getStyleLoaders("stylus-loader"),
      },
      // 处理图片
      {
        test: /\.(png|jpe?g|gif|webp|svg)/,
        type: "asset",
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024, // 小于10kb的图片会被base64处理
          },
        },
      },
      // 处理其他资源
      {
        test: /\.(woff2?|ttf)/,
        type: "asset/resource",
      },
      // 处理js资源
      {
        test: /\.jsx?$/,
        include: path.resolve(__dirname, "./src"),
        loader: "babel-loader",
        options: {
          cacheDirectory: true,
          cacheCompression: false,
          plugins: [!isProduction && "react-refresh/babel"].filter(Boolean), // 是否激活jsHMR
        },
      },
    ],
  },
  plugins: [
    new ESLintWebpackPlugin({
      // 指定检查文件的根目录
      context: path.resolve(__dirname, "./src"),
      exclude: "node_modules",
      cache: true,
      cacheLocation: path.resolve(
        __dirname,
        "../node_modules/.cache/eslintcache"
      ),
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "./public/index.html"),
      favicon: "./public/favicon.ico", // 设置图标
    }),
    isProduction &&
      new MiniCssExtractPlugin({
        filename: "static/css/[name].[contenthash:8].css",
        chunkFilename: "static/css/[name].[contenthash:8].chunk.css",
      }),
    !isProduction && new ReactRefreshWebpackPlugin(),
  ].filter(Boolean),
  mode: isProduction ? "production" : "development",
  devtool: isProduction ? "source-map" : "cheap-module-source-map",
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        // 手动分包打包成不同chunk(将react等相关较大的node_modules分包)
        // react react-dom react-router-dom
        // antd
        // else
        // 以上三者分别打包
        react: {
          // 专门处理react相关库
          test: /node_modules[\\/]react(.*)?[\\/]/,
          name: "chunk-react",
          priority: 40,
        },
        antd: {
          // 专门处理antd相关库
          test: /node_modules[\\/]antd[\\/]/,
          name: "chunk-antd",
          priority: 30,
        },
        else: {
          // 专门处理其他库
          test: /node_modules[\\/]/,
          name: "chunk-libs",
          priority: 20,
        },
      },
    },
    runtimeChunk: {
      name: (entrypoint) => `runtime~${entrypoint.name}.js`,
    },
    minimize: isProduction, // 是否开启压缩选项
    minimizer: [
      // 压缩css
      new CssMinimizer(),
      // 压缩js
      new TerserWebpackPlugin(),
      new ImageMinimizerPlugin({
        minimizer: {
          implementation: ImageMinimizerPlugin.imageminGenerate,
          options: {
            plugins: [
              ["gifsicle", { interlaced: true }],
              ["jpegtran", { progressive: true }],
              ["optipng", { optimizationLevel: 5 }],
              [
                "svgo",
                {
                  plugins: [
                    "preset-default",
                    "prefixIds",
                    {
                      name: "sortAttrs",
                      params: {
                        xmlnsOrder: "alphabetical",
                      },
                    },
                  ],
                },
              ],
            ],
          },
        },
      }),
    ],
  },
  // webpack解析模块加载选项
  resolve: {
    extensions: [".jsx", ".js", ".json"],
  },
  // 不用管他,通过指令控制
  devServer: {
    host: "localhost",
    port: 3000,
    open: true,
    hot: true,
    historyApiFallback: true, // 解决前端路由刷新404问题
  },
  performance: false, // 掩耳盗铃,不提示哪些文件打包太大了,从而实现稍微快一点的打包(乐)
};
