const axios = require('axios');
const xml2js = require('xml2js');

const arbeitnow = async (req, res) => {
    try {
        const apiUrl = 'https://arbeitnow.com/api/job-board-api';
        const response = await axios.get(apiUrl);
        res.send(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to fetch data" });
    }
};

const arbeitnowOnlyOne = async (req, res) => {
    try {
        const { slug } = req.params;
        const apiUrl = `https://arbeitnow.com/api/job-board-api`;
        const response = await axios.get(apiUrl);

        const job = response.data.find(job => job.slug === slug);
        if (!job) {
            return res.status(404).send({ error: "Job not found" });
        }

        res.send({ data: job });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to fetch data" });
    }
};


const devitjobs_plus_arbeitjobs = async (req, res) => {
    try {
        const devUrl = 'https://devitjobs.uk/job_feed.xml';
        const arbeitUrl = 'https://arbeitnow.com/api/job-board-api';
        const responseDev = await axios.get(devUrl);
        console.log("devitjobs response:");
        console.log(responseDev);
        const responseArbeit = await axios.get(arbeitUrl);
        console.log("arbeitnow response:");
        console.log(responseArbeit);

        xml2js.parseString(responseDev.data, (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).send({ error: "Failed to parse XML" });
            } else {
                const resultDev = result;
                console.log(resultDev);
                const mergedResult = mergeAndRenameKeys(resultDev, responseArbeit.data.data);
                res.send(mergedResult);
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to fetch data" });
    }
};


function mergeAndRenameKeys(resultDev, responseArbeit) {
    // Extract the array of jobs from the parsed XML result
    const jobsFromXml = resultDev.jobs.job;

    // Create a new array from jobsFromXml with renamed keys
    const renamedJobsFromXml = jobsFromXml.map(job => ({
        ...job,
        company_name: job['company-name'],
        pubdate: job['pubdate'],
        job_types: job['job-types'],
        slug: job['$']['id'], // Use the id from the devitjobs API as the slug
    }));

    // Remove the old keys
    renamedJobsFromXml.forEach(job => {
        delete job['company-name'];
        delete job['pubdate'];
        delete job['job-types'];
        delete job['id'];
    });

    // Merge the array from XML with the responseArbeit data
    const mergedResult = [...renamedJobsFromXml, ...responseArbeit];

    return mergedResult;
}

const devitjobs_plus_arbeitjobsOnlyOne = async (req, res) => {
    try {
        const { slug } = req.params;
        const devUrl = 'https://devitjobs.uk/job_feed.xml';
        const arbeitUrl = 'https://arbeitnow.com/api/job-board-api';
        const responseDev = await axios.get(devUrl);
        const responseArbeit = await axios.get(arbeitUrl);

        xml2js.parseString(responseDev.data, (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).send({ error: "Failed to parse XML" });
            } else {
                const resultDev = result;
                const mergedResult = mergeAndRenameKeys(resultDev, responseArbeit.data.data);
                const job = mergedResult.find(job => job.slug === slug);
                if (!job) {
                    return res.status(404).send({ error: "Job not found" });
                }
                res.send({ data: job });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to fetch data" });
    }
};



module.exports = {
    arbeitnow,
    arbeitnowOnlyOne,
    devitjobs_plus_arbeitjobs,
    devitjobs_plus_arbeitjobsOnlyOne
};
