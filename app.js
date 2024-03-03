const express = require('express');
const app = express();
const axios = require('axios');

app.get('/search/:stockTicker', async function (req, res) {

    const stockTickerSymbol = req.params.stockTicker;

    try {
        const stockProfileResponse = await axios.get('https://finnhub.io/api/v1/stock/profile2', {
            params: {
                token: 'cmuk1nhr01qltmc0qh1gcmuk1nhr01qltmc0qh20',
                symbol: stockTickerSymbol
            }
        });

        const latestPriceResponse = await axios.get('https://finnhub.io/api/v1/quote', {
            params: {
                token: 'cmuk1nhr01qltmc0qh1gcmuk1nhr01qltmc0qh20',
                symbol: stockTickerSymbol
            }
        });

        const companyPeersResponse = await axios.get('https://finnhub.io/api/v1/stock/peers', {
            params: {
                token: 'cmuk1nhr01qltmc0qh1gcmuk1nhr01qltmc0qh20',
                symbol: stockTickerSymbol
            }
        });

        // Charts API to fetch past 6 hours data and plot it

        // const chartPointResponse = await axios.get('')

        let combinedStockTabResponse = {
            stockProfile: stockProfileResponse.data,
            latestPrice: latestPriceResponse.data,
            companyPeers: companyPeersResponse.data
        };


        console.log("Combined response is", combinedStockTabResponse);
        res.send(combinedStockTabResponse);

    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.get('/charts/:stockTicker', async function (req, res) {

    const stockTickerSymbol = req.params.stockTicker;
    console.log("Charts API");
    try {
        const multiplier = 1;
        const timespan = 'day';

        const to_date = new Date();
        const from_date = new Date(to_date - 2 * 365 * 24 * 60 * 60 * 1000); // 2 years ago

        const to_date_str = to_date.toISOString().split('T')[0];
        const from_date_str = from_date.toISOString().split('T')[0];

        const api_url = `https://api.polygon.io/v2/aggs/ticker/${stockTickerSymbol}/range/${multiplier}/${timespan}/${from_date_str}/${to_date_str}?adjusted=true&sort=asc&apiKey=mwjPq5ceMqn18edHgYpUrK5ZgBul4p2v`;
        console.log(api_url);
        const response = await axios.get(api_url);

        const chartDetails = response.data;

        if (!chartDetails) {
            return res.status(400).json({ error: 'Chart details not found. Please check stock ticker symbol again.' });
        }

        res.send(chartDetails);

    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});


app.get('/news/:stockTicker', async function (req, res) {

    try {
        const stockTicker = req.params.stockTicker;
        const now = new Date();
        const from_date = new Date(now - 7 * 24 * 60 * 60 * 1000); // 7 days ago

        const from_date_str = from_date.toISOString().split('T')[0];
        const to_date_str = now.toISOString().split('T')[0];

        const response = await axios.get('https://finnhub.io/api/v1/company-news', {
            params: {
                symbol: stockTicker,
                from: from_date_str,
                to: to_date_str,
                token: 'cmuk1nhr01qltmc0qh1gcmuk1nhr01qltmc0qh20',
            },
        });

        // console.log("Company news response is:", response);

        const companyNews = filterCompleteEntries(response.data);
        if (!companyNews.length) {
            return res.status(400).json({ error: 'Company news not found' });
        }

        res.send(companyNews);

    } catch (error) {
        console.error('Error fetching company news:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


app.get('/insights/:stockTicker', async function (req, res) {

    try {

        const stockTicker = req.params.stockTicker;

        const recommendationResponse = await axios.get('https://finnhub.io/api/v1/stock/recommendation', {
            params: {
                token: 'cmuk1nhr01qltmc0qh1gcmuk1nhr01qltmc0qh20',
                symbol: stockTicker
            }
        });

        console.log(recommendationResponse);

        const now = new Date();
        const to_date_str = now.toISOString().split('T')[0];
        const from_date_str = "2022-01-01";

        const insiderSentimentResponse = await axios.get('https://finnhub.io/api/v1/stock/insider-sentiment', {
            params: {
                token: 'cmuk1nhr01qltmc0qh1gcmuk1nhr01qltmc0qh20',
                symbol: stockTicker,
                from: from_date_str,
                to: to_date_str
            }
        });

        console.log(insiderSentimentResponse);

        const earningsResponse = await axios.get('https://finnhub.io/api/v1/stock/earnings', {
            params: {
                token: 'cmuk1nhr01qltmc0qh1gcmuk1nhr01qltmc0qh20',
                symbol: stockTicker
            }
        });

        console.log(earningsResponse);

        let combinedInsightsResponse = {
            stockRecommendations: recommendationResponse.data,
            insiderSentiments: insiderSentimentResponse.data,
            companyEarnings: earningsResponse.data
        };

        res.send(combinedInsightsResponse);

    } catch (error) {

        console.error('Error fetching company insights:', error.message);
        return res.status(500).json({ error: 'Internal server error' });

    }
});


app.get('/autoComplete/:query', async function (req, res) {

    const query = req.params.query;

    const autoCompleteResponse = await axios.get('https://finnhub.io/api/v1/search', {
        params: {
            q: query,
            token: 'cmuk1nhr01qltmc0qh1gcmuk1nhr01qltmc0qh20'
        }
    });

    res.send(autoCompleteResponse.data);
});

function filterCompleteEntries(articles) {
    return articles.filter(article => Object.values(article).every(value => value !== ''));
}

app.listen('3000', () => {
    console.log(`Server is running on port 3000`);
});
