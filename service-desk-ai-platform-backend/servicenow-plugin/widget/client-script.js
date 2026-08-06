/**
 * AI Suggestion Panel - Client Script (AngularJS)
 * 
 * Service Portal Widget Name: ai-suggestion-panel
 * 
 * This controller listens for incident description changes,
 * calls the AI backend, and displays resolution suggestions.
 */
api.controller = function($scope, $timeout, spUtil) {
  var c = this;
  var searchTimeout = null;
  var DEBOUNCE_MS = 1500;

  // Initialize data
  $scope.data = {
    showPanel: false,
    loading: false,
    suggestions: [],
    searched: false,
    lastQuery: ''
  };

  /**
   * Watch for description field changes (parent scope)
   * Adjust 'description' to match your incident form field name
   */
  $scope.$on('field.changed', function(event, field) {
    if (field.name === 'short_description' || field.name === 'description') {
      var value = field.value || '';
      if (value.length >= 10) {
        triggerSearch(value);
      }
    }
  });

  /**
   * Alternative: Direct binding if widget is on the form
   * Uncomment below and remove the $scope.$on above
   */
  // c.$watch('data.description', function(newVal) {
  //   if (newVal && newVal.length >= 10) {
  //     triggerSearch(newVal);
  //   }
  // });

  /**
   * Debounced search trigger
   */
  function triggerSearch(description) {
    if (searchTimeout) {
      $timeout.cancel(searchTimeout);
    }

    searchTimeout = $timeout(function() {
      performSearch(description);
    }, DEBOUNCE_MS);
  }

  /**
   * Call the AI backend for suggestions
   */
  function performSearch(description) {
    if (description === $scope.data.lastQuery) return;
    
    $scope.data.lastQuery = description;
    $scope.data.showPanel = true;
    $scope.data.loading = true;
    $scope.data.suggestions = [];
    $scope.data.searched = false;

    // Call Script Include (client-callable)
    var ga = new GlideAjax('AIServiceDeskClient');
    ga.addParam('sysparm_name', 'getSuggestions');
    ga.addParam('sysparm_description', description);
    ga.getXMLAnswer(function(response) {
      $scope.$apply(function() {
        $scope.data.loading = false;
        $scope.data.searched = true;

        try {
          var result = JSON.parse(response);
          
          // Extract suggestions from response
          if (result.similarIncidents && result.similarIncidents.length > 0) {
            $scope.data.suggestions = result.similarIncidents.map(function(inc) {
              return {
                incidentNumber: inc.number || inc.incidentNumber,
                title: inc.title || inc.short_description,
                resolution: inc.resolution || inc.resolutionNotes,
                textContent: inc.textContent,
                relevanceScore: inc.relevanceScore || inc.confidence || 0.8,
                documentId: inc.documentId || inc.sysId
              };
            });
          } else if (result.results && result.results.length > 0) {
            $scope.data.suggestions = result.results.map(function(r) {
              return {
                incidentNumber: r.documentId,
                title: r.metadata && r.metadata.title ? r.metadata.title : r.textContent,
                resolution: null,
                textContent: r.textContent,
                relevanceScore: r.relevanceScore || 0.8,
                documentId: r.documentId
              };
            });
          } else {
            $scope.data.suggestions = [];
          }
        } catch (e) {
          $scope.data.suggestions = [];
        }
      });
    });
  }

  /**
   * Use a suggested resolution
   */
  $scope.useResolution = function(suggestion) {
    // Copy resolution to form field
    var resolutionField = g_form.getValue('resolution_notes') || '';
    var newResolution = suggestion.resolution || suggestion.textContent || '';
    
    if (resolutionField) {
      newResolution = resolutionField + '\n\n--- AI Suggested Resolution ---\n' + newResolution;
    }
    
    g_form.setValue('resolution_notes', newResolution);
    
    // Optionally set state to Resolved
    g_form.setValue('state', '6');
    g_form.setValue('close_code', 'Closed/Resolved by Caller');
    
    spUtil.addInfoMessage('Resolution applied from: ' + (suggestion.incidentNumber || 'AI Suggestion'));
  };

  /**
   * Dismiss a suggestion
   */
  $scope.dismissSuggestion = function(index) {
    $scope.data.suggestions.splice(index, 1);
    if ($scope.data.suggestions.length === 0) {
      $scope.data.showPanel = false;
    }
  };

  /**
   * Submit a new ticket anyway
   */
  $scope.submitNewTicket = function() {
    g_form.submit();
  };

  /**
   * Get score color based on relevance
   */
  $scope.getScoreColor = function(score) {
    if (score >= 0.8) return '#28a745';
    if (score >= 0.6) return '#ffc107';
    return '#dc3545';
  };
};
