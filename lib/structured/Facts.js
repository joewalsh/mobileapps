const DocumentWorker = require('../html/DocumentWorker');
const NodeType = require('../nodeType');

const hrefRegex = /^\.\/([^#]+)#?(.+)?$/;
const trimLeadingRegex = /^\s+/;

/**
 * StructuredPage turns Parsoid HTML into JSON
 */
class Facts extends DocumentWorker {
    /**
     * Run the next processing step.
     * @param {!DOMNode} node to process
     */
    process(node) {
        while (this.ancestor && this.ancestor !== node.parentNode) {
            if (this.ancestor === this.excludedNode) {
                this.excludedNode = undefined;
            }
            if (this.ancestor === this.anchorNode) {
                this.anchorNode = undefined;
                if (this.currentLink) {
                    this.currentLink.end = this.currentFact.text.length;
                }
            }
            this.ancestor = this.ancestor.parentNode;
        }
        switch (node.nodeType) {
            case NodeType.ELEMENT_NODE:
                this.processElement(node);
                break;
            case NodeType.TEXT_NODE:
                this.processText(node);
                break;
        }
        this.ancestor = node;
    }

    processElement(element) {
        if (this.excludedNode) {
            return;
        }
        const tagName = element.tagName;
        if (this.isTopLevelSection(tagName, element)) {
            if (this.currentSection) {
                this.sections.push(this.currentSection);
            }
            this.currentSection = this.newSection();
            return;
        }
        switch (tagName) {
            case 'SPAN':
                if (element.id === 'coordinates') {
                    this.excludedNode = element;
                }
                break;
            case 'DIV':
            case 'TABLE':
                this.excludedNode = element;
                break;
            case 'A':
                this.processAnchor(element);
                break;
            case 'P':
                this.processParagraph(element);
                break;
            case 'H1':
            case 'H2':
            case 'H3':
            case 'H4':
            case 'H5':
            case 'H6':
                this.processHeader(element);
                break;
            case 'SUP':
                this.processSuperscript(element);
                break;
        }
    }

    processText(text) {
        if (this.excludedNode || !this.currentFact) {
            return;
        }
        let textContent = text.textContent;
        if (!this.currentFact.text || this.currentFact.text === '') {
            textContent = textContent.replace(trimLeadingRegex, '');
        }
        this.currentFact.text += textContent;
    }

    newSection() {
        return {
            paragraphs: []
        };
    }

    newFact() {
        return {
            text: '',
            references: [],
            links: []
        };
    }
    processWikiLink(anchor) {
        if (anchor.classList.contains('mw-disambig')) {
            return;
        }
        const href = anchor.getAttribute('href');
        if (!href) {
            return;
        }
        const match = hrefRegex.exec(href);
        if (!match[1]) {
            return;
        }
        this.anchorNode = anchor;
        const link = {
            title: match[1],
            start: this.currentFact.text.length || 0
        };
        if (match[2]) {
            link.fragment = match[2];
        }
        this.currentLink = link;
        this.linkedEntities[match[1]] = '';
        this.currentFact.links.push(link);
    }

    processAnchor(anchor) {
        if (!this.currentFact) {
            return;
        }
        const rel = anchor.getAttribute('rel');
        switch (rel) {
            case 'mw:WikiLink':
                this.processWikiLink(anchor);
                break;
        }
    }

    processReference(sup) {
        this.excludedNode = sup;
        const anchor = sup.firstElementChild;
        if (!anchor) {
            return;
        }
        const href = anchor.getAttribute('href');
        if (!href) {
            return;
        }
        const match = hrefRegex.exec(href);
        const id = match[2];
        if (!id) {
            return;
        }
        // this.currentFact.references.push(id);
        const referenceTextElement = this.doc.getElementById(`mw-reference-text-${id}`);
        if (!referenceTextElement) {
            return;
        }
        // const citeElement = referenceTextElement.firstElementChild;
        // if (!citeElement) {
        //     return;
        // }
        const reference = { text: referenceTextElement.innerHTML, id };
        // const data = sup.getAttribute('data-mw');
        // if (data) {
        //     const structuredRef = JSON.parse(data);
        //     if (structuredRef) {
        //         const attrs = structuredRef.attrs;
        //         if (attrs) {
        //             Object.keys(attrs).forEach(key => {
        //                 reference[key] = attrs[key];
        //             });
        //         }
        //     }
        // }
        this.currentFact.references.push(reference);
        const nextSibling = sup.nextElementSibling;
        if (nextSibling && this.isReference(nextSibling)) {
            this.processReference(nextSibling);
            return;
        }
        this.treeWalker.currentNode = sup;
        if (!this.currentFact.text.trim().endsWith('.')) {
            return;
        }
        this.currentParagraph.facts.push(this.currentFact);
        this.currentFact = this.newFact();
    }

    isReference(element) {
        const rel = element.getAttribute('rel');
        return rel === 'dc:references';
    }

    processSuperscript(sup) {
        if (!this.isReference(sup)) {
            return;
        }
        this.processReference(sup);
    }

    processParagraph(paragraph) {
        if (this.currentParagraph
            && this.currentParagraph.facts
            && this.currentParagraph.facts.length > 0) {
            this.currentSection.paragraphs.push(this.currentParagraph);
        }
        this.currentFact = this.newFact();
        this.currentParagraph = { facts: [] };
    }

    processHeader(header) {
        if (!this.currentSection) {
            return;
        }
        if (this.currentSection.title) {
            return;
        }
        this.currentSection.title = header.textContent;
    }

    /**
     * Determines whether an element is a <section> tag with the <body> tag as its parent
     * @param {string} tagName capitalized tag name of the element
     * @param {Element} element
     * @return {boolean} true if the element is a <section> tag and its parent is a <body> tag
     */
    isTopLevelSection(tagName, element) {
        return tagName === 'SECTION' && element.parentElement.tagName === 'BODY';
    }

    /**
     * Run the next finalization step. All of the DOM manipulation occurs here because
     * manipulating the DOM while walking it will result in an incomplete walk.
     */
    finalizeStep() {
        this.output = {
            linkedEntities: this.linkedEntities,
            sections: this.sections
        };
        return false;
    }

    /**
     * Returns a MobileHTML object ready for processing
     * @param {!Document} doc document to process
     * @param {?Object} metadata metadata object that should include:
     *   {!string} baseURI the baseURI for the REST API
     *   {!string} revision the revision of the page
     *   {!string} tid the tid of the page
    */
    constructor(doc, metadata) {
        super(doc);
        this.metadata = metadata;
        this.sections = [];
        this.linkedEntities = {};
    }
}

module.exports = Facts;
