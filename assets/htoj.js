const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')

const htmlFile = `index.html`
const archiveDir = 'archive'
const script = 'assets/archive.js'
const requiredcardCount = 11

// Function to extract contact details
function extractContactDetails(contactElement) {
  const contactDetails = []
  const contactLinks = contactElement.find('a')

  contactLinks.each((index, link) => {
    const iconElement = $(link)
      .prev()
      .is('i')
      ? $(link).prev('i')
      : $(link).find('i')
    const icon = iconElement.attr('class')
    const url = $(link).attr('href')
    const handle = $(link)
      .text()
      .trim()

    contactDetails.push({
      icon: icon,
      link: url,
      handle: handle,
    })
  })

  return contactDetails
}

// Function to extract resource details
function extractResourceDetails(resourcesElement) {
  const resources = []
  const resourceElements = resourcesElement.find('li')

  // Extract details for each resource
  resourceElements.each((index, element) => {
    const resource = {
      title: '',
      link: '',
      text: '',
    }

    const linkElement = $(element).find('a')
    resource.title = linkElement.attr('title') || ''
    resource.link = linkElement.attr('href') || ''
    resource.text = linkElement.text().trim() || ''

    resources.push(resource)
  })

  return resources
}

// Function to save cards in a JSON file
function saveCardsAsJSON(cards, filePath, num) {
  const jsonData = JSON.stringify(cards, null, 2)
  fs.writeFileSync(filePath, jsonData)
  console.log('\u{1F4C2} Created archive_' + num + '.json')
}

// Function to delete selected cards from the index.html file
function deleteCardsFromHTML(selectedCards) {
  selectedCards.each((index, element) => {
    $(element).remove()
  })

  const updatedHTML = $.html()
  fs.writeFileSync(htmlFile, updatedHTML)
  console.log('\u{1F6AE} Deleted cards from ' + htmlFile)
}

// Function to update the script.js file
function updateScriptFile(script, nextNumber) {
  const scriptFile = fs.readFileSync(script, 'utf-8')

  const updatedScript = scriptFile.replace(/const numberOfFiles = \d+/, `const numberOfFiles = ${nextNumber}`)
  fs.writeFileSync(script, updatedScript)
  console.log('\u{1F4C3} Updated ' + script)
}

// Read the HTML file
const html = fs.readFileSync(htmlFile, 'utf-8')

// Load the HTML into Cheerio
const $ = cheerio.load(html)

// Fetch all the cards
const cardElements = $('.card')
const cardCount = cardElements.length

if (cardCount < requiredcardCount) {
  return console.log("\u{1F6D1} It's not the right time to archive the cards. Please try again later.")
} else {
  // Exclude the first 10 cards
  const selectedCards = cardElements.slice(10)

  // Convert selected cards to JSON
  const jsonCards = convertToJSON(selectedCards)

  // Function to convert cards to JSON format
  function convertToJSON(cards) {
    // Array to store the card objects
    const jsonCards = []

    // Iterate over each card
    cards.each((index, element) => {
      const card = {}

      // Extract name
      card.name = $(element)
        .find('.name')
        .text()
        .trim()

      // Extract contact details
      const contactElement = $(element).find('.contact')
      card.contacts = extractContactDetails(contactElement)

      // Extract about section
      card.about = $(element)
        .find('.about')
        .text()
        .trim()

      // Extract resources
      const resourcesElement = $(element).find('.resources')
      card.resources = extractResourceDetails(resourcesElement)

      // Add the card object to the array
      jsonCards.push(card)
    })
    console.log('\u{23F3} Converting cards to JSON...')
    return jsonCards
  }

  // Determine the next sequential number for the archive file
  const archiveFiles = fs.readdirSync(archiveDir)
  const nextNumber = archiveFiles.length + 1
  const archiveFilePath = path.join(archiveDir, `archive_${nextNumber}.json`)

  // Save selected cards in a JSON file
  saveCardsAsJSON(jsonCards, archiveFilePath, nextNumber)

  // Delete selected cards from index.html
  deleteCardsFromHTML(selectedCards)

  // Update the script.js file
  updateScriptFile(script, nextNumber)

  console.log('\u{1F4AF} Conversion complete!')
}